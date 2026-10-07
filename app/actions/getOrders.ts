"use server";
import {requireAdmin} from "@/app/lib/adminApi";

import prisma from "@/app/lib/prisma";
import {OrderStatus, PaymentMethod, type TrafficSource} from "@prisma/client";
import {getDailyOrderSummaryQuery, getOrderFilters, getOrderPageQuery, ORDERS_PAGE_SIZE} from "@/app/lib/orderPagination";
import {getOrderDateKey} from "@/app/utils/formatDate";

export interface IOrderItem {
    id: number;
    orderId: number;
    productId: number | null;
    productColorId: number | null;
    product: {
        id: number;
        slug: string;
        category: {slug: string} | null;
    } | null;
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
    checkboxReceiptStatus: string | null;
    checkboxReceiptUrl: string | null;
    checkboxAfterpaymentReceiptUrl: string | null;
    items: IOrderItem[]
}

export interface IOrdersParams {
    status?: OrderStatus | "All";
    sort?: string;
    search?: string;
    tab?: string;
    orderId?: string;
}

export interface IOrdersCursor {
    id: number;
    createdAt: string;
    totalAmount: number;
}

export interface IOrderDailySummary {
    date: string;
    ordersCount: number;
    totalAmount: number;
}

export interface IOrdersPage {
    orders: IOrder[];
    nextCursor: IOrdersCursor | null;
    dailySummaries: IOrderDailySummary[];
}

async function getOrderProducts(items: {productId: number | null; isCustom: boolean}[]) {
    const productIds = [...new Set(items.flatMap(item =>
        !item.isCustom && item.productId !== null ? [item.productId] : []
    ))];
    const products = productIds.length ? await prisma.product.findMany({
        where: {id: {in: productIds}},
        select: {
            id: true,
            slug: true,
            category: {select: {slug: true}},
            colors: {select: {id: true, color: true, colorName: true, colorCode: true}},
        },
    }) : [];

    return new Map(products.map(product => [product.id, product]));
}

function enrichOrderItems<T extends {productId: number | null; isCustom: boolean; color: string | null; colorName: string | null; colorCode: string | null}>(
    items: T[],
    products: Awaited<ReturnType<typeof getOrderProducts>>,
) {
    return items.map(item => {
        const product = !item.isCustom && item.productId !== null ? products.get(item.productId) : undefined;
        const productColor = product?.colors.find(color => item.colorCode
            ? color.colorCode === item.colorCode
            : item.colorName !== null && item.color !== null && color.colorName === item.colorName && color.color === item.color
        );

        return {
            ...item,
            product: product ? {id: product.id, slug: product.slug, category: product.category} : null,
            productColorId: productColor?.id ?? null,
        };
    });
}

export async function getOrderById(orderId: number): Promise<IOrder | null> {
    await requireAdmin();
    try {
        const order = await prisma.order.findUnique({
            where: {id: orderId},
            include: {items: true},
        });
        if (!order) return null;

        const products = await getOrderProducts(order.items);

        return {
            ...order,
            items: enrichOrderItems(order.items, products),
        };
    } catch (error: unknown) {
        throw error instanceof Error ? error : new Error("Failed to get order")
    }
}

export async function getOrders(params?: IOrdersParams, cursor?: IOrdersCursor): Promise<IOrdersPage> {
    await requireAdmin();
    try {
        const filters = getOrderFilters(params);
        const pageQuery = getOrderPageQuery(params, cursor);
        const result = await prisma.order.findMany({
            where: {AND: [filters.where, pageQuery.where]},
            orderBy: pageQuery.orderBy,
            take: ORDERS_PAGE_SIZE + 1,
            include: {
                items: true,
            },
        });

        const orders = result.slice(0, ORDERS_PAGE_SIZE);
        const dates = [...new Set(orders.map(order => getOrderDateKey(order.createdAt)))];
        const [products, dailySummaries] = await Promise.all([
            getOrderProducts(orders.flatMap(order => order.items)),
            dates.length
                ? prisma.$queryRaw<IOrderDailySummary[]>(getDailyOrderSummaryQuery(dates, filters.sql))
                : Promise.resolve([]),
        ]);
        const lastOrder = orders[orders.length - 1];

        return {
            orders: orders.map(order => ({
                ...order,
                items: enrichOrderItems(order.items, products),
            })),
            nextCursor: result.length > ORDERS_PAGE_SIZE && lastOrder ? {
                id: lastOrder.id,
                createdAt: lastOrder.createdAt.toISOString(),
                totalAmount: lastOrder.totalAmount,
            } : null,
            dailySummaries,
        };
    }
    catch (error: unknown) {
        throw error instanceof Error ? error : new Error("Failed to get orders")
    }
}
