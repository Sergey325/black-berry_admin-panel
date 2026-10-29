import { NextResponse } from "next/server";
import {isAdminRequest, unauthorizedResponse} from "@/app/lib/adminApi";
import prisma from "@/app/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import {createTTN} from "@/app/lib/novaposhta";
import {FormValuesOrder, isPaymentSource} from "@/app/types";
import {randomUUID} from "node:crypto";
import {fiscalizeStorefrontOrder} from "@/app/lib/storefrontFiscalization";
import {notifyStorefrontOrderTelegram} from "@/app/lib/storefrontOrderTelegram";
import {calculateCodPrepayment, MIN_COD_PREPAYMENT} from "@/app/lib/orderTotal";
import {OrderItemError} from "@/app/lib/orderItems";

type ManualOrderRequest = FormValuesOrder & {
    warehouseNumber: number | null;
};

export const maxDuration = 60;

export async function POST(request: Request) {
    console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);

    if (!await isAdminRequest()) return unauthorizedResponse();
    const requestStartedAt = Date.now();

    try {
        const body = await request.json() as ManualOrderRequest;

        if (body.isWholesale !== undefined && typeof body.isWholesale !== "boolean") {
            return NextResponse.json({error: "Invalid wholesale flag"}, {status: 400});
        }

        if (!isPaymentSource(body.paymentSource)) {
            return NextResponse.json({error: "Invalid payment source"}, {status: 400});
        }

        const { firstName, lastName, phone, email, comment, city, area, cityRef, warehouse, warehouseNumber, warehouseRef, paymentMethod, trafficSource, items } = body;
        const normalizedPhone = phone.replace(/\D/g, "") || null;

        if (!items.length || items.some((item) => !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
            return NextResponse.json({error: "Кількість товару має бути додатним цілим числом"}, {status: 400});
        }

        if (items.some((item) => !Number.isFinite(item.price) || item.price <= 0)) {
            return NextResponse.json({error: "Ціна товару має бути додатним числом"}, {status: 400});
        }

        const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            return NextResponse.json({error: "Некоректна сума замовлення"}, {status: 400});
        }

        const prepaymentAmount = body.prepaymentAmount ?? calculateCodPrepayment(totalAmount, Number(process.env.COD_PREPAYMENT_PERCENT));
        if (paymentMethod === PaymentMethod.CASH_ON_DELIVERY && (
            typeof prepaymentAmount !== "number" || !Number.isFinite(prepaymentAmount)
            || prepaymentAmount < MIN_COD_PREPAYMENT || Math.round(prepaymentAmount * 100) >= Math.round(totalAmount * 100)
        )) {
            return NextResponse.json({error: `Передоплата має бути не меншою за ${MIN_COD_PREPAYMENT} грн та меншою за суму замовлення`}, {status: 400});
        }
        const paidAmount = paymentMethod === PaymentMethod.CASH_ON_DELIVERY
            ? Math.round(prepaymentAmount * 100) / 100
            : totalAmount;
        const databaseStartedAt = Date.now();

        const order = await prisma.$transaction(async (tx) => {
            const requestedByProductSizeId = new Map<number, number>();
            const orderItems = [];

            for (const item of items) {
                let productSizeId: number | null = null;

                if (!item.isCustom) {
                    if (item.productId == null || item.productColorId == null) {
                        throw new OrderItemError("Оберіть товар та колір з каталогу");
                    }

                    const matches = await tx.productSize.findMany({
                        where: {
                            size: item.size.trim(),
                            productColorId: item.productColorId,
                            productColor: {productId: item.productId},
                        },
                        select: {id: true},
                        take: 2,
                    });

                    if (matches.length !== 1) {
                        throw new OrderItemError(`Розмір товару «${item.name.trim()}» змінився. Оновіть сторінку`);
                    }

                    productSizeId = matches[0].id;
                    requestedByProductSizeId.set(
                        productSizeId,
                        (requestedByProductSizeId.get(productSizeId) ?? 0) + item.quantity,
                    );
                }

                orderItems.push({
                    productId: item.isCustom ? null : item.productId,
                    productSizeId,
                    name: item.name.trim(),
                    price: item.price,
                    quantity: item.quantity,
                    color: item.color.trim() || null,
                    colorCode: item.colorCode.trim() || null,
                    colorName: item.colorName.trim() || null,
                    size: item.size.trim() || null,
                    imageUrl: item.imageUrl.trim() || null,
                    isCustom: item.isCustom,
                });
            }

            for (const [productSizeId, requestedQuantity] of [...requestedByProductSizeId].sort(([a], [b]) => a - b)) {
                const updatedCount = await tx.$executeRaw`
                    UPDATE "ProductSize"
                    SET
                        "quantity" = CASE
                            WHEN "quantity" IS NULL THEN NULL
                            ELSE "quantity" - ${requestedQuantity}
                        END,
                        "available" = CASE
                            WHEN "quantity" IS NULL THEN "available"
                            WHEN "quantity" - ${requestedQuantity} <= 0 THEN FALSE
                            ELSE "available"
                        END
                    WHERE
                        "id" = ${productSizeId}
                        AND "available" = TRUE
                        AND ("quantity" IS NULL OR "quantity" >= ${requestedQuantity})
                `;

                if (updatedCount !== 1) {
                    const item = orderItems.find((item) => item.productSizeId === productSizeId);
                    throw new OrderItemError(`Недостатньо товару «${item?.name ?? productSizeId}» у наявності`);
                }
            }

            return tx.order.create({
                data: {
                    status: "PAID",
                    publicToken: randomUUID(),
                    totalAmount: paidAmount,
                    firstName,
                    lastName,
                    phone: normalizedPhone,
                    email,
                    comment,
                    city,
                    area: area,
                    cityRef: cityRef,
                    warehouse: warehouse,
                    warehouseNumber: warehouseNumber,
                    warehouseRef: warehouseRef,
                    paymentMethod: paymentMethod as PaymentMethod,
                    paymentSource: body.paymentSource,
                    trafficSource,
                    isWholesale: body.isWholesale ?? false,
                    paidAt: new Date(),
                    items: {
                        create: orderItems,
                    },
                },
                include: {
                    items: true,
                },
            });
        });
        const databaseDurationMs = Date.now() - databaseStartedAt;

        let ttnDurationMs: number | null = null;
        let fiscalizationDurationMs: number | null = null;
        let fiscalizationStatus: "skipped" | "done" | "failed" = "skipped";
        let fiscalizationError: string | null = null;

        const createOrderTtn = async () => {
            if (!order.phone || !order.firstName || !order.lastName || !order.warehouseRef || !order.cityRef || !order.warehouseNumber) {
                return;
            }

            const startedAt = Date.now();

            try {
                const {ttnNumber, ttnRef} = await createTTN({
                    recipientFirstName: order.firstName,
                    recipientLastName: order.lastName,
                    recipientPhone: order.phone,
                    recipientCityRef: order.cityRef,
                    recipientWarehouseRef: order.warehouseRef,
                    recipientWarehouseNumber: order.warehouseNumber.toString(),
                    serviceType: order.warehouse?.includes("Відділення") ? "WarehouseWarehouse" : "WarehousePostomat",
                    cost: totalAmount,
                    codAmount: paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? Math.max(0, totalAmount - paidAmount) : 0,
                    description: order.items.map((item) => item.name).join(", "),
                });

                await prisma.order.update({
                    where: {id: order.id},
                    data: {ttnNumber, ttnRef},
                });
            } catch (error: unknown) {
                console.error("Failed to create TTN for order", {
                    orderId: order.id,
                    error,
                });
            } finally {
                ttnDurationMs = Date.now() - startedAt;
            }
        };

        const createInitialReceipt = async () => {
            if (!body.createFiscalReceipt) return;

            const startedAt = Date.now();

            try {
                await fiscalizeStorefrontOrder(order.id, {
                    type: "initial",
                    paymentSource: order.paymentSource,
                });
                fiscalizationStatus = "done";
            } catch (error: unknown) {
                fiscalizationStatus = "failed";
                fiscalizationError = error instanceof Error ? error.message : "Fiscalization failed";
                console.error("[Storefront fiscalization] Initial receipt failed", {
                    orderId: order.id,
                    error,
                });
            } finally {
                fiscalizationDurationMs = Date.now() - startedAt;
            }
        };

        if (body.createFiscalReceipt && paymentMethod === PaymentMethod.MONOBANK) {
            await Promise.all([createOrderTtn(), createInitialReceipt()]);
        } else {
            await createOrderTtn();
            await createInitialReceipt();
        }

        if (process.env.VERCEL_ENV === "production") {
            try {
                await notifyStorefrontOrderTelegram(order.id);
            } catch (error: unknown) {
                console.error("[Storefront Telegram] Order notification failed", {
                    orderId: order.id,
                    error,
                });
            }
        }

        const totalDurationMs = Date.now() - requestStartedAt;
        console.log("[Order create] Completed", {
            orderId: order.id,
            paymentMethod,
            databaseDurationMs,
            ttnDurationMs,
            fiscalizationDurationMs,
            totalDurationMs,
        });

        return NextResponse.json({
            orderId: order.id,
            fiscalization: {
                status: fiscalizationStatus,
                error: fiscalizationError,
            },
            timings: {
                databaseDurationMs,
                ttnDurationMs,
                fiscalizationDurationMs,
                totalDurationMs,
            },
        }, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof OrderItemError) {
            return NextResponse.json({error: error.message}, {status: 409});
        }

        console.error("[Order create] Failed", {
            totalDurationMs: Date.now() - requestStartedAt,
            error,
        });
        return NextResponse.json(error, { status: 500 });
    }
}
