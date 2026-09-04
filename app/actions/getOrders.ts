"use server";

import prisma from "@/app/lib/prisma";
import {OrderStatus, PaymentMethod, Prisma, type TrafficSource} from "@prisma/client";

export interface IOrderItem {
    id: number;
    orderId: number;
    productId: number | null;
    name: string;
    price: number;
    quantity: number;
    color: string | null;
    colorName: string | null;
    colorCode: string | null;
    size: string | null;
    imageUrl: string | null;
    isCustom: boolean;
}

export interface IOrder {
    id: number;
    invoiceId: string | null;
    status: OrderStatus;
    totalAmount: number;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    email: string | null;
    comment: string| null;
    city: string | null;
    cityRef: string | null;
    warehouse: string | null;
    warehouseRef: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    paidAt: Date | string | null;
    discountAmount: number | null;
    promoCodeSnapshot: string | null;
    paymentMethod: PaymentMethod;
    area: string | null;
    ttnNumber: string | null;
    ttnRef: string | null;
    warehouseNumber: number | null;
    fbc: string | null;
    trafficSource: TrafficSource | null;
    items: IOrderItem[]
}

export interface IOrdersParams {
    status?: OrderStatus | "All";
    sort?: string;
    search?: string;
    tab?: string;
    orderId?: string;
}

export async function getOrderById(orderId: number): Promise<IOrder | null> {
    try {
        return await prisma.order.findUnique({
            where: {id: orderId},
            include: {items: true},
        });
    } catch (error: unknown) {
        throw error instanceof Error ? error : new Error("Failed to get order")
    }
}

export async function getOrders(params?: IOrdersParams) {
    try {
        const { status, sort, search } = params ?? {};
        const searchTerm = search?.trim();
        const phoneSearch = searchTerm?.replace(/\D/g, "");

        const orderBy: Prisma.OrderOrderByWithRelationInput =
            sort === "price_asc" ? { totalAmount: "asc" } :
                sort === "price_desc" ? { totalAmount: "desc" } :
                    sort === "oldest" ? { createdAt: "asc" } :
                        { createdAt: "desc" } // newest по умолчанию

        const where: Prisma.OrderWhereInput = {
            ...(status === "All"
                ? {}
                : status
                    ? {status: status as OrderStatus}
                    : {status: {not: OrderStatus.PENDING}}),
            ...(searchTerm
                ? {
                    OR: [
                        {id: {equals: Number(searchTerm)}},
                        {lastName: {contains: searchTerm, mode: "insensitive"}},
                        {email: {contains: searchTerm, mode: "insensitive"}},
                        {phone: {contains: searchTerm}},
                        ...(phoneSearch && phoneSearch !== searchTerm
                            ? [{phone: {contains: phoneSearch}}]
                            : []),
                    ],
                }
                : {}),
        };

        const orders = await prisma.order.findMany({
            where,
            orderBy,
            include: {
                items: true,
            },
        });

        return orders;
    }
    catch (error: unknown) {
        throw error instanceof Error ? error : new Error("Failed to get orders")
    }
}
