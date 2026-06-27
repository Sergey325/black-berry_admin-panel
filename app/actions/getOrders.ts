"use server";

import prisma from "@/app/lib/prisma";
import {OrderStatus, PaymentMethod} from "@prisma/client";

export interface IOrderItem {
    id: number;
    orderId: number;
    productId: number;
    name: string;
    price: number;
    quantity: number;
    color: string;
    colorName: string | null;
    size: string;
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
    paymentMethod: PaymentMethod;
    area: string;
    ttnNumber: string | null;
    ttnRef: string | null;
    warehouseNumber: number;
    items: IOrderItem[]
}

export interface IOrdersParams {
    status?: OrderStatus | "All";
    sort?: string;
}

export async function getOrders(params?: IOrdersParams) {
    try {
        const { status, sort } = params ?? {};

        const orderBy: any =
            sort === "price_asc" ? { totalAmount: "asc" } :
                sort === "price_desc" ? { totalAmount: "desc" } :
                    sort === "oldest" ? { createdAt: "asc" } :
                        { createdAt: "desc" } // newest по умолчанию

        const where =
            status === "All"
                ? {}
                : status
                    ? { status: status as OrderStatus }
                    : { status: { not: OrderStatus.PENDING } };

        const orders = await prisma.order.findMany({
            where,
            orderBy,
            include: {
                items: true,
            },
        });

        return orders;
    }
    catch (error: any) {
        throw new Error(error)
    }
}