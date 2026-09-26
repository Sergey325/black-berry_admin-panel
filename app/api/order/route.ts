import { NextResponse } from "next/server";
import {isAdminRequest, unauthorizedResponse} from "@/app/lib/adminApi";
import prisma from "@/app/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import {createTTN} from "@/app/lib/novaposhta";
import {FormValuesOrder, isInitialPaymentSource} from "@/app/types";
import {randomUUID} from "node:crypto";
import {fiscalizeStorefrontOrder} from "@/app/lib/storefrontFiscalization";
import {notifyStorefrontOrderTelegram} from "@/app/lib/storefrontOrderTelegram";
import {CASH_ON_DELIVERY_PREPAYMENT_AMOUNT} from "@/app/lib/orderTotal";

type ManualOrderRequest = FormValuesOrder & {
    warehouseNumber: number | null;
};

export const maxDuration = 60;

export async function POST(request: Request) {
    if (!await isAdminRequest()) return unauthorizedResponse();
    const requestStartedAt = Date.now();

    try {
        const body = await request.json() as ManualOrderRequest;

        if (body.createFiscalReceipt && !isInitialPaymentSource(body.paymentSource)) {
            return NextResponse.json({error: "Invalid initial payment source"}, {status: 400});
        }

        const { firstName, lastName, phone, email, comment, city, area, cityRef, warehouse, warehouseNumber, warehouseRef, paymentMethod, trafficSource, items } = body;
        const normalizedPhone = phone.replace(/\D/g, "") || null;

        const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const paidAmount = paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? CASH_ON_DELIVERY_PREPAYMENT_AMOUNT : totalAmount;
        const databaseStartedAt = Date.now();

        const order = await prisma.order.create({
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
                trafficSource,
                paidAt: new Date(),
                items: {
                    create: items.map((item) => ({
                        productId: item.isCustom ? null : item.productId,
                        name: item.name.trim(),
                        price: item.price,
                        quantity: item.quantity,
                        color: item.color.trim() || null,
                        colorCode: item.colorCode.trim() || null,
                        colorName: item.colorName.trim() || null,
                        size: item.size.trim() || null,
                        imageUrl: item.imageUrl.trim() || null,
                        isCustom: item.isCustom,
                    })),
                },
            },
            include: {
                items: true,
            },
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
                    paymentSource: body.paymentSource,
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

        try {
            await notifyStorefrontOrderTelegram(order.id);
        } catch (error: unknown) {
            console.error("[Storefront Telegram] Order notification failed", {
                orderId: order.id,
                error,
            });
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
        console.error("[Order create] Failed", {
            totalDurationMs: Date.now() - requestStartedAt,
            error,
        });
        return NextResponse.json(error, { status: 500 });
    }
}
