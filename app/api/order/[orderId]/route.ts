import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {OrderStatus, PaymentMethod} from "@prisma/client";
import {FormValuesOrder} from "@/app/types";

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

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<IParams> }
) {
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

            await prisma.order.update({
                where: {id},
                data: {status: body.status},
            });

            return NextResponse.json(null, {status: 200});
        }

        if (!Array.isArray(body.items) || body.items.length === 0) {
            return NextResponse.json({error: "Order must contain at least one item"}, {status: 400});
        }

        const normalizedTtnNumber = body.ttnNumber.trim() || null;
        if (normalizedTtnNumber && !/^\d{14}$/.test(normalizedTtnNumber)) {
            return NextResponse.json({error: "TTN number must contain 14 digits"}, {status: 400});
        }

        const normalizedPhone = body.phone.replace(/\D/g, "") || null;
        const itemsSubtotal = body.items.reduce((total, item) => total + item.price * item.quantity, 0);

        await prisma.$transaction(async (transaction) => {
            const existingOrder = await transaction.order.findUnique({
                where: {id},
                select: {
                    ttnNumber: true,
                    discountAmount: true,
                },
            });

            if (!existingOrder) {
                throw new Error("Order not found");
            }

            const ttnChanged = existingOrder.ttnNumber !== normalizedTtnNumber;

            await transaction.order.update({
                where: {id},
                data: {
                    totalAmount: Math.max(0, itemsSubtotal - (existingOrder.discountAmount ?? 0)),
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
                    ttnNumber: normalizedTtnNumber,
                    ...(ttnChanged ? {
                        ttnRef: null,
                        ttnStatus: null,
                        ttnStatusCode: null,
                        ttnStatusUpdatedAt: null,
                    } : {}),
                    items: {
                        deleteMany: {},
                        create: body.items.map((item) => ({
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
            });
        });

        return NextResponse.json(null, {status: 200});
    } catch (error: unknown) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Failed to update order";
        return NextResponse.json({error: message}, {status: message === "Order not found" ? 404 : 500});
    }
}
