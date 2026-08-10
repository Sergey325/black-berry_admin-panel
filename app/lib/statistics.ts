import { Prisma } from "@prisma/client";
import prisma from "@/app/lib/prisma";
import { getMonthDistance, getMonthPeriods } from "@/app/lib/adminApi";
import type { MonthPeriod, MonthRange } from "@/app/lib/adminApi";

export const BUSINESS_TIME_ZONE = "Europe/Kyiv";

const REVENUE_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "ARRIVED", "DELIVERED"] as const;

interface SummaryRow {
    revenue: number;
    ordersCount: bigint;
    pendingCashOnDeliveryAmount: number;
}

interface RefundRow {
    refundedAmount: number;
    refundedOrdersCount: bigint;
}

interface StatusRow {
    status: string;
    count: bigint;
}

interface DailyRevenueRow {
    date: string;
    revenue: number;
    ordersCount: bigint;
}

interface TopProductRow {
    productId: number;
    name: string;
    imageUrl: string;
    totalSold: bigint;
    revenue: number;
    pendingGoodsValue: number;
}

interface TopCategoryRow {
    categoryId: number;
    name: string;
    totalSold: bigint;
    revenue: number;
    pendingGoodsValue: number;
}

interface TopColorRow {
    color: string;
    colorName: string | null;
    totalSold: bigint;
}

export interface MonthlyStats {
    period: MonthRange;
    revenue: number;
    expenses: number;
    netProfit: number;
    ordersCount: number;
    averageOrderValue: number;
    pendingCashOnDeliveryAmount: number;
    refundedAmount: number;
    refundedOrdersCount: number;
    previousPeriod: {
        revenue: number;
        netProfit: number;
        ordersCount: number;
        revenueChangePercent: number | null;
        profitChangePercent: number | null;
    };
    statusBreakdown: { status: string; count: number }[];
    dailyRevenue: { date: string; revenue: number; ordersCount: number }[];
    topProducts: {
        productId: number;
        name: string;
        imageUrl: string;
        totalSold: number;
        revenue: number;
        pendingGoodsValue: number;
    }[];
    topCategories: {
        categoryId: number;
        name: string;
        totalSold: number;
        revenue: number;
        pendingGoodsValue: number;
    }[];
    topColors: {
        color: string;
        colorName: string | null;
        totalSold: number;
    }[];
}

function getTimeZoneOffset(date: Date) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: BUSINESS_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const localTime = Date.UTC(
        Number(values.year),
        Number(values.month) - 1,
        Number(values.day),
        Number(values.hour),
        Number(values.minute),
        Number(values.second),
    );

    return localTime - date.getTime();
}

function startOfMonthInBusinessTime(year: number, month: number) {
    const utcGuess = Date.UTC(year, month - 1, 1);
    let result = utcGuess - getTimeZoneOffset(new Date(utcGuess));
    result = utcGuess - getTimeZoneOffset(new Date(result));
    return new Date(result);
}

function shiftMonth(period: MonthPeriod, amount: number) {
    const value = period.year * 12 + period.month - 1 + amount;
    return { year: Math.floor(value / 12), month: value % 12 + 1 };
}

function getDateRange(range: MonthRange) {
    const monthAfterRange = shiftMonth(range.to, 1);
    return {
        start: startOfMonthInBusinessTime(range.from.year, range.from.month),
        end: startOfMonthInBusinessTime(monthAfterRange.year, monthAfterRange.month),
    };
}

function getPreviousRange(range: MonthRange): MonthRange {
    const monthCount = getMonthDistance(range.from, range.to) + 1;
    return {
        from: shiftMonth(range.from, -monthCount),
        to: shiftMonth(range.to, -monthCount),
    };
}

function round(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function percentChange(current: number, previous: number) {
    return previous === 0 ? null : round(((current - previous) / Math.abs(previous)) * 100);
}

async function getRevenueSummary(start: Date, end: Date) {
    const rows = await prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
        WITH eligible_orders AS (
            SELECT
                o."id",
                o."status",
                o."paymentMethod",
                o."totalAmount",
                SUM(oi."price" * oi."quantity") AS "itemsAmount"
            FROM "Order" o
            LEFT JOIN "OrderItem" oi ON oi."orderId" = o."id"
            WHERE o."paidAt" >= ${start}
              AND o."paidAt" < ${end}
              AND o."status"::text IN (${Prisma.join(REVENUE_STATUSES)})
            GROUP BY o."id", o."status", o."paymentMethod", o."totalAmount"
        )
        SELECT
            COALESCE(SUM(
                CASE
                    WHEN "paymentMethod"::text = 'CASH_ON_DELIVERY' AND "status"::text = 'DELIVERED'
                        THEN COALESCE("itemsAmount", "totalAmount")
                    ELSE "totalAmount"
                END
            ), 0)::double precision AS revenue,
            COUNT(*)::bigint AS "ordersCount",
            COALESCE(SUM(
                CASE
                    WHEN "paymentMethod"::text = 'CASH_ON_DELIVERY' AND "status"::text <> 'DELIVERED'
                        THEN GREATEST(COALESCE("itemsAmount", "totalAmount") - "totalAmount", 0)
                    ELSE 0
                END
            ), 0)::double precision AS "pendingCashOnDeliveryAmount"
        FROM eligible_orders
    `);

    return {
        revenue: Number(rows[0]?.revenue ?? 0),
        ordersCount: Number(rows[0]?.ordersCount ?? 0),
        pendingCashOnDeliveryAmount: Number(rows[0]?.pendingCashOnDeliveryAmount ?? 0),
    };
}

async function getExpenses(range: MonthRange) {
    const result = await prisma.monthlyExpense.aggregate({
        where: { OR: getMonthPeriods(range) },
        _sum: { amount: true },
    });

    return result._sum.amount ?? 0;
}

export async function getStats(period: MonthRange): Promise<MonthlyStats> {
    const range = getDateRange(period);
    const previousPeriod = getPreviousRange(period);
    const previousRange = getDateRange(previousPeriod);

    const [
        summary,
        expenses,
        previousSummary,
        previousExpenses,
        refundRows,
        statusRows,
        dailyRows,
        productRows,
        categoryRows,
        colorRows,
    ] = await Promise.all([
        getRevenueSummary(range.start, range.end),
        getExpenses(period),
        getRevenueSummary(previousRange.start, previousRange.end),
        getExpenses(previousPeriod),
        prisma.$queryRaw<RefundRow[]>(Prisma.sql`
            SELECT
                COALESCE(SUM("totalAmount"), 0)::double precision AS "refundedAmount",
                COUNT(*)::bigint AS "refundedOrdersCount"
            FROM "Order"
            WHERE "paidAt" >= ${range.start}
              AND "paidAt" < ${range.end}
              AND "status"::text = 'REFUNDED'
        `),
        prisma.$queryRaw<StatusRow[]>(Prisma.sql`
            SELECT "status"::text AS status, COUNT(*)::bigint AS count
            FROM "Order"
            WHERE "createdAt" >= ${range.start}
              AND "createdAt" < ${range.end}
            GROUP BY "status"
            ORDER BY count DESC, status ASC
        `),
        prisma.$queryRaw<DailyRevenueRow[]>(Prisma.sql`
            WITH eligible_orders AS (
                SELECT
                    o."id",
                    o."paidAt",
                    o."status",
                    o."paymentMethod",
                    o."totalAmount",
                    SUM(oi."price" * oi."quantity") AS "itemsAmount"
                FROM "Order" o
                LEFT JOIN "OrderItem" oi ON oi."orderId" = o."id"
                WHERE o."paidAt" >= ${range.start}
                  AND o."paidAt" < ${range.end}
                  AND o."status"::text IN (${Prisma.join(REVENUE_STATUSES)})
                GROUP BY o."id", o."paidAt", o."status", o."paymentMethod", o."totalAmount"
            )
            SELECT
                TO_CHAR("paidAt" AT TIME ZONE ${BUSINESS_TIME_ZONE}, 'YYYY-MM-DD') AS date,
                COALESCE(SUM(
                    CASE
                        WHEN "paymentMethod"::text = 'CASH_ON_DELIVERY' AND "status"::text = 'DELIVERED'
                            THEN COALESCE("itemsAmount", "totalAmount")
                        ELSE "totalAmount"
                    END
                ), 0)::double precision AS revenue,
                COUNT(*)::bigint AS "ordersCount"
            FROM eligible_orders
            GROUP BY date
            ORDER BY date ASC
        `),
        prisma.$queryRaw<TopProductRow[]>(Prisma.sql`
            SELECT
                oi."productId" AS "productId",
                (ARRAY_AGG(oi."name" ORDER BY o."paidAt" DESC, oi."id" DESC))[1] AS name,
                (ARRAY_AGG(oi."imageUrl" ORDER BY o."paidAt" DESC, oi."id" DESC))[1] AS "imageUrl",
                SUM(oi."quantity")::bigint AS "totalSold",
                COALESCE(SUM(
                    CASE
                        WHEN o."paymentMethod"::text = 'CASH_ON_DELIVERY' AND o."status"::text <> 'DELIVERED' THEN 0
                        ELSE oi."price" * oi."quantity"
                    END
                ), 0)::double precision AS revenue,
                COALESCE(SUM(
                    CASE
                        WHEN o."paymentMethod"::text = 'CASH_ON_DELIVERY' AND o."status"::text <> 'DELIVERED'
                            THEN oi."price" * oi."quantity"
                        ELSE 0
                    END
                ), 0)::double precision AS "pendingGoodsValue"
            FROM "OrderItem" oi
            INNER JOIN "Order" o ON o."id" = oi."orderId"
            WHERE o."paidAt" >= ${range.start}
              AND o."paidAt" < ${range.end}
              AND o."status"::text IN (${Prisma.join(REVENUE_STATUSES)})
            GROUP BY oi."productId"
            ORDER BY "totalSold" DESC, revenue DESC
            LIMIT 10
        `),
        prisma.$queryRaw<TopCategoryRow[]>(Prisma.sql`
            SELECT
                c."id" AS "categoryId",
                c."name" AS name,
                SUM(oi."quantity")::bigint AS "totalSold",
                COALESCE(SUM(
                    CASE
                        WHEN o."paymentMethod"::text = 'CASH_ON_DELIVERY' AND o."status"::text <> 'DELIVERED' THEN 0
                        ELSE oi."price" * oi."quantity"
                    END
                ), 0)::double precision AS revenue,
                COALESCE(SUM(
                    CASE
                        WHEN o."paymentMethod"::text = 'CASH_ON_DELIVERY' AND o."status"::text <> 'DELIVERED'
                            THEN oi."price" * oi."quantity"
                        ELSE 0
                    END
                ), 0)::double precision AS "pendingGoodsValue"
            FROM "OrderItem" oi
            INNER JOIN "Order" o ON o."id" = oi."orderId"
            INNER JOIN "Product" p ON p."id" = oi."productId"
            INNER JOIN "Category" c ON c."id" = p."categoryId"
            WHERE o."paidAt" >= ${range.start}
              AND o."paidAt" < ${range.end}
              AND o."status"::text IN (${Prisma.join(REVENUE_STATUSES)})
            GROUP BY c."id", c."name"
            ORDER BY "totalSold" DESC, revenue DESC
            LIMIT 10
        `),
        prisma.$queryRaw<TopColorRow[]>(Prisma.sql`
            SELECT
                oi."color" AS color,
                (ARRAY_AGG(oi."colorName" ORDER BY o."paidAt" DESC, oi."id" DESC)
                    FILTER (WHERE oi."colorName" IS NOT NULL))[1] AS "colorName",
                SUM(oi."quantity")::bigint AS "totalSold"
            FROM "OrderItem" oi
            INNER JOIN "Order" o ON o."id" = oi."orderId"
            WHERE o."paidAt" >= ${range.start}
              AND o."paidAt" < ${range.end}
              AND o."status"::text IN (${Prisma.join(REVENUE_STATUSES)})
            GROUP BY oi."color"
            ORDER BY "totalSold" DESC, color ASC
            LIMIT 10
        `),
    ]);

    const netProfit = round(summary.revenue - expenses);
    const previousNetProfit = round(previousSummary.revenue - previousExpenses);
    const dailyRevenue = new Map(dailyRows.map((row) => [row.date, {
        revenue: Number(row.revenue),
        ordersCount: Number(row.ordersCount),
    }]));
    const startDay = Date.UTC(period.from.year, period.from.month - 1, 1);
    const endDay = Date.UTC(period.to.year, period.to.month, 1);
    const days = Array.from(
        { length: Math.round((endDay - startDay) / 86_400_000) },
        (_, index) => new Date(startDay + index * 86_400_000).toISOString().slice(0, 10),
    );

    return {
        period,
        revenue: round(summary.revenue),
        expenses: round(expenses),
        netProfit,
        ordersCount: summary.ordersCount,
        averageOrderValue: summary.ordersCount === 0 ? 0 : round(summary.revenue / summary.ordersCount),
        pendingCashOnDeliveryAmount: round(summary.pendingCashOnDeliveryAmount),
        refundedAmount: round(Number(refundRows[0]?.refundedAmount ?? 0)),
        refundedOrdersCount: Number(refundRows[0]?.refundedOrdersCount ?? 0),
        previousPeriod: {
            revenue: round(previousSummary.revenue),
            netProfit: previousNetProfit,
            ordersCount: previousSummary.ordersCount,
            revenueChangePercent: percentChange(summary.revenue, previousSummary.revenue),
            profitChangePercent: percentChange(netProfit, previousNetProfit),
        },
        statusBreakdown: statusRows.map((row) => ({ status: row.status, count: Number(row.count) })),
        dailyRevenue: days.map((date) => {
            const day = dailyRevenue.get(date);
            return {
                date,
                revenue: round(day?.revenue ?? 0),
                ordersCount: day?.ordersCount ?? 0,
            };
        }),
        topProducts: productRows.map((row) => ({
            productId: row.productId,
            name: row.name,
            imageUrl: row.imageUrl,
            totalSold: Number(row.totalSold),
            revenue: round(Number(row.revenue)),
            pendingGoodsValue: round(Number(row.pendingGoodsValue)),
        })),
        topCategories: categoryRows.map((row) => ({
            categoryId: row.categoryId,
            name: row.name,
            totalSold: Number(row.totalSold),
            revenue: round(Number(row.revenue)),
            pendingGoodsValue: round(Number(row.pendingGoodsValue)),
        })),
        topColors: colorRows.map((row) => ({
            color: row.color,
            colorName: row.colorName,
            totalSold: Number(row.totalSold),
        })),
    };
}
