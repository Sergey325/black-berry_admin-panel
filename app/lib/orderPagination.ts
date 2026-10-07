import {OrderStatus, Prisma} from "@prisma/client";
import type {IOrdersCursor, IOrdersParams} from "@/app/actions/getOrders";
import {getOrderSearchId} from "@/app/lib/orderSearch";

export const ORDERS_PAGE_SIZE = 10;

export function getOrderFilters(params: IOrdersParams = {}) {
    const status = params.status;
    if (status && status !== "All" && !Object.values(OrderStatus).includes(status)) {
        throw new Error("Invalid order status");
    }

    const searchTerm = params.search?.trim();
    const phoneSearch = searchTerm?.replace(/\D/g, "");
    const searchId = searchTerm ? getOrderSearchId(searchTerm) : undefined;
    const where: Prisma.OrderWhereInput = {
        ...(status === "All" ? {} : status
            ? {status}
            : {status: {not: OrderStatus.PENDING}}),
        ...(searchTerm ? {
            OR: [
                ...(searchId === undefined ? [] : [{id: {equals: searchId}}]),
                {lastName: {contains: searchTerm, mode: "insensitive"}},
                {email: {contains: searchTerm, mode: "insensitive"}},
                {phone: {contains: searchTerm}},
                ...(phoneSearch && phoneSearch !== searchTerm ? [{phone: {contains: phoneSearch}}] : []),
            ],
        } : {}),
    };

    const conditions: Prisma.Sql[] = [];
    if (status !== "All") {
        conditions.push(status
            ? Prisma.sql`o."status"::text = ${status}`
            : Prisma.sql`o."status"::text <> ${OrderStatus.PENDING}`);
    }
    if (searchTerm) {
        const pattern = `%${searchTerm}%`;
        const searchConditions = [
            ...(searchId === undefined ? [] : [Prisma.sql`o."id" = ${searchId}`]),
            Prisma.sql`o."lastName" ILIKE ${pattern}`,
            Prisma.sql`o."email" ILIKE ${pattern}`,
            Prisma.sql`o."phone" LIKE ${pattern}`,
            ...(phoneSearch && phoneSearch !== searchTerm ? [Prisma.sql`o."phone" LIKE ${`%${phoneSearch}%`}`] : []),
        ];
        conditions.push(Prisma.sql`(${Prisma.join(searchConditions, " OR ")})`);
    }

    return {
        where,
        sql: conditions.length ? Prisma.join(conditions, " AND ") : Prisma.sql`TRUE`,
    };
}

export function getOrderPageQuery(params: IOrdersParams = {}, cursor?: IOrdersCursor) {
    const ascending = params.sort === "price_asc" || params.sort === "oldest";
    const direction = ascending ? "asc" : "desc";
    const byPrice = params.sort === "price_asc" || params.sort === "price_desc";
    const orderBy: Prisma.OrderOrderByWithRelationInput[] = [
        byPrice ? {totalAmount: direction} : {createdAt: direction},
        {id: direction},
    ];

    if (!cursor) return {orderBy, where: {}};
    if (!Number.isInteger(cursor.id) || cursor.id <= 0 || cursor.id > 2147483647
        || !Number.isFinite(cursor.totalAmount) || Number.isNaN(new Date(cursor.createdAt).getTime())) {
        throw new Error("Invalid order cursor");
    }

    const comparison = ascending ? "gt" : "lt";
    const boundary: Prisma.OrderWhereInput = byPrice
        ? {totalAmount: {[comparison]: cursor.totalAmount}}
        : {createdAt: {[comparison]: new Date(cursor.createdAt)}};
    const sameValue: Prisma.OrderWhereInput = byPrice
        ? {totalAmount: cursor.totalAmount}
        : {createdAt: new Date(cursor.createdAt)};
    const where: Prisma.OrderWhereInput = {
        OR: [boundary, {...sameValue, id: {[comparison]: cursor.id}}],
    };

    return {orderBy, where};
}

export function getDailyOrderSummaryQuery(dates: string[], filters: Prisma.Sql) {
    const sortedDates = [...dates].sort();
    const localDate = Prisma.sql`TO_CHAR(o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Kyiv', 'YYYY-MM-DD')`;

    return Prisma.sql`
        WITH daily_orders AS (
            SELECT
                o."id",
                ${localDate} AS date,
                o."status",
                o."paymentMethod",
                o."totalAmount",
                SUM(oi."price" * oi."quantity") AS "itemsAmount"
            FROM "Order" o
            LEFT JOIN "OrderItem" oi ON oi."orderId" = o."id"
            WHERE ${filters}
              AND o."createdAt" >= (${sortedDates[0]}::date::timestamp AT TIME ZONE 'Europe/Kyiv' AT TIME ZONE 'UTC')
              AND o."createdAt" < ((${sortedDates[sortedDates.length - 1]}::date + INTERVAL '1 day') AT TIME ZONE 'Europe/Kyiv' AT TIME ZONE 'UTC')
              AND ${localDate} IN (${Prisma.join(dates)})
            GROUP BY o."id"
        )
        SELECT
            date,
            COUNT(*)::integer AS "ordersCount",
            COALESCE(SUM(CASE
                WHEN "status"::text NOT IN ('PAID', 'PROCESSING', 'SHIPPED', 'ARRIVED', 'DELIVERED') THEN 0
                WHEN "paymentMethod"::text = 'CASH_ON_DELIVERY' AND "itemsAmount" IS NOT NULL
                    THEN GREATEST("itemsAmount", 0)
                ELSE "totalAmount"
            END), 0)::double precision AS "totalAmount"
        FROM daily_orders
        GROUP BY date
    `;
}
