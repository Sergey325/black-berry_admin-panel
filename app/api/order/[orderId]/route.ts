import { NextResponse } from "next/server";
import {isAdminRequest, unauthorizedResponse} from "@/app/lib/adminApi";
import prisma from "@/app/lib/prisma";
import {OrderStatus, PaymentMethod} from "@prisma/client";
import {FormValuesOrder, isPaymentSource} from "@/app/types";
import {fiscalizeStorefrontOrder} from "@/app/lib/storefrontFiscalization";
import {OrderItemError, reconcileOrderItems} from "@/app/lib/orderItems";
import {getOrderStatusUpdate, OrderStatusError} from "@/app/lib/orderStatus";
import {calculateCodPrepayment, getOrderFullAmount} from "@/app/lib/orderTotal";
import {saveTTN} from "@/app/lib/novaposhta";
import {prepareOrderReceiptCorrection} from "@/app/lib/checkboxCorrection";
import {getOrderDocumentChanges, getOrderItemsAmount, getShipmentData, type OrderDocumentChanges} from "@/app/lib/orderDocuments";
import {createHash} from "node:crypto";

interface IParams {
    orderId: string;
}

type OrderUpdateRequest = FormValuesOrder & {
    warehouseNumber: number | null;
    confirmDocuments?: string;
};

type OrderPatchRequest = {
    status: OrderStatus;
} | OrderUpdateRequest;

const orderStatuses = new Set<string>(Object.values(OrderStatus));

export const maxDuration = 90;

class OrderDocumentConfirmation extends Error {
    constructor(readonly documents: OrderDocumentChanges, readonly version: string) {
        super("Підтвердьте зміни в документах замовлення");
    }
}

class OrderDocumentError extends Error {
    constructor(message: string, readonly createdTtnNumber?: string) {
        super(message);
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<IParams> }
) {
    if (!await isAdminRequest()) return unauthorizedResponse();
    const requestStartedAt = Date.now();

    try {
        const {orderId} = await params;
        const id = Number(orderId);
        const requestBody: unknown = await request.json();

        if (!Number.isInteger(id) || id <= 0) {
            return NextResponse.json({error: "Invalid order ID"}, {status: 400});
        }

        if (!isRecord(requestBody)) {
            return NextResponse.json({error: "Invalid request body"}, {status: 400});
        }

        const body = requestBody as OrderPatchRequest;

        if ("status" in body) {
            if (!orderStatuses.has(body.status)) {
                return NextResponse.json({error: "Invalid order status"}, {status: 400});
            }

            await prisma.$transaction(async (transaction) => {
                const order = await transaction.order.findUnique({
                    where: {id},
                    select: {
                        status: true,
                        paidAt: true,
                        paymentMethod: true,
                        totalAmount: true,
                        updatedAt: true,
                        items: {select: {price: true, quantity: true}},
                    },
                });
                if (!order) throw new Error("Order not found");
                const result = await transaction.order.updateMany({
                    where: {id, status: order.status, paidAt: order.paidAt, paymentMethod: order.paymentMethod, totalAmount: order.totalAmount, updatedAt: order.updatedAt},
                    data: {
                        ...getOrderStatusUpdate(order, body.status),
                        ...(body.status === OrderStatus.DELIVERED && order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
                            ? {totalAmount: getOrderFullAmount(order)}
                            : {}),
                    },
                });
                if (result.count !== 1) throw new OrderStatusError("Замовлення змінилося. Оновіть сторінку");
            });

            return NextResponse.json(null, {status: 200});
        }

        if (!Array.isArray(body.items) || body.items.length === 0) {
            return NextResponse.json({error: "Order must contain at least one item"}, {status: 400});
        }

        if (body.isWholesale !== undefined && typeof body.isWholesale !== "boolean") {
            return NextResponse.json({error: "Invalid wholesale flag"}, {status: 400});
        }

        if (!isPaymentSource(body.paymentSource)) {
            return NextResponse.json({error: "Invalid payment source"}, {status: 400});
        }

        if ((body.paymentMethod !== PaymentMethod.MONOBANK && body.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY)
            || typeof body.ttnNumber !== "string" || typeof body.phone !== "string") {
            return NextResponse.json({error: "Некоректний спосіб оплати, телефон або номер ТТН"}, {status: 400});
        }

        const normalizedTtnNumber = body.ttnNumber.trim() || null;
        if (normalizedTtnNumber && !/^\d{14}$/.test(normalizedTtnNumber)) {
            return NextResponse.json({error: "TTN number must contain 14 digits"}, {status: 400});
        }

        const normalizedPhone = body.phone.replace(/\D/g, "") || null;
        const itemsSubtotal = getOrderItemsAmount(body.items);
        if (!Number.isFinite(itemsSubtotal) || itemsSubtotal <= 0 || body.items.some((item) => (
            !Number.isFinite(item.price) || item.price <= 0 || !Number.isSafeInteger(item.quantity) || item.quantity <= 0
        ))) {
            return NextResponse.json({error: "Некоректна ціна або кількість товару"}, {status: 400});
        }
        const transactionStartedAt = Date.now();

        const {order, documents} = await prisma.$transaction(async (transaction) => {
            const existingOrder = await transaction.order.findUnique({
                where: {id},
                include: {items: true},
            });

            if (!existingOrder) {
                throw new Error("Order not found");
            }

            const paidAmount = body.paymentMethod === PaymentMethod.CASH_ON_DELIVERY && existingOrder.status !== OrderStatus.DELIVERED
                ? existingOrder.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
                    ? existingOrder.totalAmount
                    : calculateCodPrepayment(itemsSubtotal, Number(process.env.COD_PREPAYMENT_PERCENT))
                : itemsSubtotal;

            if (body.paymentMethod === PaymentMethod.CASH_ON_DELIVERY && existingOrder.status !== OrderStatus.DELIVERED
                && Math.round(paidAmount * 100) >= Math.round(itemsSubtotal * 100)) {
                throw new OrderItemError("Передоплата має бути меншою за суму замовлення");
            }

            const next = {
                id,
                status: existingOrder.status,
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                phone: normalizedPhone,
                cityRef: body.cityRef,
                warehouseRef: body.warehouseRef,
                warehouse: body.warehouse,
                ttnNumber: normalizedTtnNumber,
                totalAmount: paidAmount,
                paymentMethod: body.paymentMethod,
                paymentSource: body.paymentSource,
                items: body.items,
            };
            const documents = getOrderDocumentChanges(existingOrder, next, body.createFiscalReceipt === true);
            if (documents.receipt === "replace" && (
                existingOrder.status === OrderStatus.REFUNDED || existingOrder.status === OrderStatus.CANCELLED
                || existingOrder.status === OrderStatus.FAILED
            )) {
                throw new OrderItemError("Для цього статусу коригування чека потрібно виконати в Checkbox");
            }
            if (documents.receipt === "replace" && existingOrder.status === OrderStatus.DELIVERED
                && existingOrder.paymentMethod === PaymentMethod.CASH_ON_DELIVERY && !existingOrder.checkboxAfterpaymentReceiptId) {
                throw new OrderItemError("Дочекайтеся фіскалізації післяплати перед коригуванням чека");
            }
            if (documents.receipt && body.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
                && !normalizedTtnNumber && documents.ttn !== "create") {
                throw new OrderItemError("Для фіскалізації передоплати потрібен номер ТТН");
            }

            const {confirmDocuments, ...changes} = body;
            const version = createHash("sha256").update(JSON.stringify([id, existingOrder.updatedAt, changes])).digest("hex");
            if (confirmDocuments !== undefined && confirmDocuments !== version) {
                throw new OrderStatusError("Замовлення змінилося. Відкрийте його знову");
            }
            if ((documents.ttn || documents.receipt) && confirmDocuments !== version) {
                throw new OrderDocumentConfirmation(documents, version);
            }

            const result = await transaction.order.updateMany({
                where: {id, updatedAt: existingOrder.updatedAt},
                data: {
                    totalAmount: paidAmount,
                    firstName: body.firstName,
                    lastName: body.lastName,
                    phone: normalizedPhone,
                    email: body.email,
                    comment: body.comment,
                    city: body.city,
                    area: body.area,
                    cityRef: body.cityRef,
                    warehouse: body.warehouse,
                    warehouseNumber: body.warehouseNumber,
                    warehouseRef: body.warehouseRef,
                    paymentMethod: body.paymentMethod,
                    paymentSource: body.paymentSource,
                    trafficSource: body.trafficSource,
                    ...(body.isWholesale !== undefined ? {isWholesale: body.isWholesale} : {}),
                    ttnNumber: normalizedTtnNumber,
                    ...(documents.ttn === "link" ? {
                        ttnRef: null,
                        ttnStatus: null,
                        ttnStatusCode: null,
                        ttnStatusUpdatedAt: null,
                    } : {}),
                },
            });
            if (result.count !== 1) throw new OrderStatusError("Замовлення змінилося. Відкрийте його знову");
            await reconcileOrderItems(transaction, id, body.items);

            let completeCorrection: Awaited<ReturnType<typeof prepareOrderReceiptCorrection>> | undefined;
            const receiptNeedsNewTtn = documents.ttn === "create" && next.paymentMethod === PaymentMethod.CASH_ON_DELIVERY;
            if (documents.receipt === "replace" && !receiptNeedsNewTtn) {
                try {
                    completeCorrection = await prepareOrderReceiptCorrection(existingOrder, next);
                } catch (error: unknown) {
                    throw new OrderDocumentError(`Не вдалося підготувати коригування чека. ${error instanceof Error ? error.message : ""}`);
                }
            }

            let ttn: {ttnNumber: string; ttnRef: string} | undefined;
            if (documents.ttn === "create" || documents.ttn === "update") {
                try {
                    const shipment = getShipmentData(next);
                    const document = documents.ttn === "update" && existingOrder.ttnNumber
                        ? {
                            ttnNumber: existingOrder.ttnNumber,
                            ttnRef: existingOrder.ttnRef,
                            hadCod: getShipmentData(existingOrder).codAmount > 0,
                        }
                        : undefined;
                    ttn = await saveTTN(shipment, document);
                    if (documents.ttn === "update" && ttn.ttnNumber !== existingOrder.ttnNumber) {
                        throw new Error(`Нова пошта повернула новий номер ${ttn.ttnNumber}. Перевірте ТТН і прив’яжіть її вручну`);
                    }
                } catch (error: unknown) {
                    throw new OrderDocumentError(`Не вдалося зберегти ТТН. ${error instanceof Error ? error.message : ""}`);
                }
            }

            let receipt: Awaited<ReturnType<NonNullable<typeof completeCorrection>>> | undefined;
            if (documents.receipt === "replace") {
                try {
                    const correctReceipt = completeCorrection ?? await prepareOrderReceiptCorrection(existingOrder, {
                        ...next,
                        ttnNumber: ttn?.ttnNumber ?? next.ttnNumber,
                    });
                    receipt = await correctReceipt();
                } catch (error: unknown) {
                    const createdTtnNumber = documents.ttn === "create" ? ttn?.ttnNumber : undefined;
                    const retryMessage = createdTtnNumber
                        ? `ТТН №${createdTtnNumber} створено. Повторіть збереження з цим номером.`
                        : `${ttn ? "ТТН уже оновлено в Новій пошті. " : ""}Повторіть збереження з тими самими змінами.`;
                    throw new OrderDocumentError(
                        `Коригування чека не завершено. ${retryMessage} ${error instanceof Error ? error.message : ""}`,
                        createdTtnNumber,
                    );
                }
            }

            const order = ttn || receipt
                ? await transaction.order.update({where: {id}, data: {...ttn, ...receipt}})
                : next;
            return {order, documents};
        }, {timeout: 75_000});
        const transactionDurationMs = Date.now() - transactionStartedAt;

        let fiscalizationStatus: "skipped" | "done" | "failed" = documents.receipt === "replace" ? "done" : "skipped";
        let fiscalizationError: string | null = null;
        let fiscalizationDurationMs: number | null = null;

        if (documents.receipt === "create") {
            const fiscalizationStartedAt = Date.now();

            try {
                await fiscalizeStorefrontOrder(id, {
                    type: "initial",
                    paymentSource: order.paymentSource,
                });
                fiscalizationStatus = "done";
            } catch (error: unknown) {
                fiscalizationStatus = "failed";
                fiscalizationError = error instanceof Error ? error.message : "Fiscalization failed";
                console.error("[Storefront fiscalization] Initial receipt failed", {
                    orderId: id,
                    error,
                });
            } finally {
                fiscalizationDurationMs = Date.now() - fiscalizationStartedAt;
            }
        }

        const totalDurationMs = Date.now() - requestStartedAt;
        console.log("[Order update] Completed", {
            orderId: id,
            transactionDurationMs,
            fiscalizationDurationMs,
            totalDurationMs,
        });

        return NextResponse.json({
            orderId: id,
            ttn: {
                status: documents.ttn ? "done" : "skipped",
            },
            fiscalization: {
                status: fiscalizationStatus,
                error: fiscalizationError,
            },
            timings: {
                transactionDurationMs,
                fiscalizationDurationMs,
                totalDurationMs,
            },
        }, {status: 200});
    } catch (error: unknown) {
        if (error instanceof OrderDocumentConfirmation) {
            return NextResponse.json({error: error.message, documents: error.documents, version: error.version}, {status: 409});
        }
        if (error instanceof OrderDocumentError) {
            console.error("[Order update] Document operation failed", error);
            return NextResponse.json({error: error.message, createdTtnNumber: error.createdTtnNumber}, {status: 502});
        }
        if (error instanceof OrderStatusError) return NextResponse.json({error: error.message}, {status: 409});
        if (error instanceof OrderItemError) return NextResponse.json({error: error.message}, {status: 400});
        console.error("[Order update] Failed", {
            totalDurationMs: Date.now() - requestStartedAt,
            error,
        });
        const message = error instanceof Error ? error.message : "Failed to update order";
        return NextResponse.json({error: message}, {status: message === "Order not found" ? 404 : 500});
    }
}
