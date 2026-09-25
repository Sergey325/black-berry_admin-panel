import { NextResponse } from "next/server";
import {isAdminRequest, unauthorizedResponse} from "@/app/lib/adminApi";
import prisma from "@/app/lib/prisma";
import {OrderStatus, PaymentMethod} from "@prisma/client";
import {FormValuesOrder, isInitialPaymentSource} from "@/app/types";
import {fiscalizeStorefrontOrder} from "@/app/lib/storefrontFiscalization";
import {OrderItemError, reconcileOrderItems} from "@/app/lib/orderItems";
import {getOrderStatusUpdate, OrderStatusError} from "@/app/lib/orderStatus";
import {CASH_ON_DELIVERY_PREPAYMENT_AMOUNT, getOrderFullAmount} from "@/app/lib/orderTotal";

interface IParams {
    orderId: string;
}

type OrderUpdateRequest = FormValuesOrder & {
    warehouseNumber: number | null;
};

type OrderPatchRequest = {
    status: OrderStatus;
} | OrderUpdateRequest;

const orderStatuses = new Set<string>(Object.values(OrderStatus));

export const maxDuration = 60;

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

        if (body.createFiscalReceipt && !isInitialPaymentSource(body.paymentSource)) {
            return NextResponse.json({error: "Invalid initial payment source"}, {status: 400});
        }

        const normalizedTtnNumber = body.ttnNumber.trim() || null;
        if (normalizedTtnNumber && !/^\d{14}$/.test(normalizedTtnNumber)) {
            return NextResponse.json({error: "TTN number must contain 14 digits"}, {status: 400});
        }

        const normalizedPhone = body.phone.replace(/\D/g, "") || null;
        const itemsSubtotal = body.items.reduce((total, item) => total + item.price * item.quantity, 0);
        const transactionStartedAt = Date.now();

        await prisma.$transaction(async (transaction) => {
            const existingOrder = await transaction.order.findUnique({
                where: {id},
                select: {
                    ttnNumber: true,
                    status: true,
                },
            });

            if (!existingOrder) {
                throw new Error("Order not found");
            }

            const ttnChanged = existingOrder.ttnNumber !== normalizedTtnNumber;

            await transaction.order.update({
                where: {id},
                data: {
                    totalAmount: body.paymentMethod === PaymentMethod.CASH_ON_DELIVERY && existingOrder.status !== OrderStatus.DELIVERED
                        ? CASH_ON_DELIVERY_PREPAYMENT_AMOUNT
                        : Math.max(0, itemsSubtotal),
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
                    paymentMethod: body.paymentMethod as PaymentMethod,
                    trafficSource: body.trafficSource,
                    ttnNumber: normalizedTtnNumber,
                    ...(ttnChanged ? {
                        ttnRef: null,
                        ttnStatus: null,
                        ttnStatusCode: null,
                        ttnStatusUpdatedAt: null,
                    } : {}),
                },
            });
            await reconcileOrderItems(transaction, id, body.items);
        });
        const transactionDurationMs = Date.now() - transactionStartedAt;

        let fiscalizationStatus: "skipped" | "done" | "failed" = "skipped";
        let fiscalizationError: string | null = null;
        let fiscalizationDurationMs: number | null = null;

        if (body.createFiscalReceipt) {
            const fiscalizationStartedAt = Date.now();

            try {
                await fiscalizeStorefrontOrder(id, {
                    type: "initial",
                    paymentSource: body.paymentSource,
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
