"use server";

import prisma from "@/app/lib/prisma";
import {OrderStatus, PaymentMethod, Prisma} from "@prisma/client";

export interface IOrderItem {
    id: number;
    orderId: number;
    productId: number;
    name: string;
    price: number;
    quantity: number;
    color: string;
    colorName: string | null;
    colorCode: string | null;
    size: string | null;
    imageUrl: string;
}

export interface IOrder {
    id: number;
    invoiceId: string | null;
    status: OrderStatus;
    totalAmount: number;
    firstName: string;
    lastName: string
    phone: string;
    email: string | null;
    comment: string| null;
    city: string;
    cityRef: string;
    warehouse: string;
    warehouseRef: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    paidAt: Date | string | null;
    discountAmount: number | null;
    promoCodeSnapshot: string | null;
    paymentMethod: PaymentMethod;
    area: string;
    ttnNumber: string | null;
    ttnRef: string | null;
    warehouseNumber: number;
    fbc: string | null;
    items: IOrderItem[]
}

export interface IOrdersParams {
    status?: OrderStatus | "All";
    sort?: string;
    search?: string;
    tab?: string;
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
                        {invoiceId: {contains: searchTerm, mode: "insensitive"}},
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
