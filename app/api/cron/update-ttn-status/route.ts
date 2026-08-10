import {OrderStatus} from "@prisma/client";
import {after, NextResponse} from "next/server";
import prisma from "@/app/lib/prisma";
import {chunk, getStatusDocuments} from "@/app/lib/novaposhta";
import {mapNPStatusToOrderStatus} from "@/app/lib/npStatusMapping";

const FINAL_ORDER_STATUSES = [
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
];

export const maxDuration = 60;

export async function processTtnUpdates() {
    let totalOrders = 0;
    let processedOrders = 0;
    let errors = 0;

    try {
        const orders = await prisma.order.findMany({
            where: {
                ttnNumber: {not: null},
                ttnRef: {not: null},
                status: {notIn: FINAL_ORDER_STATUSES},
            },
            select: {
                id: true,
                status: true,
                ttnNumber: true,
                ttnRef: true,
            },
        });
        const trackedOrders = orders.filter((order): order is typeof order & {
            ttnNumber: string;
            ttnRef: string;
        } => order.ttnNumber !== null
            && order.ttnRef !== null
            && order.ttnNumber.trim().length > 0
            && order.ttnRef.trim().length > 0);

        totalOrders = trackedOrders.length;

        for (const [batchIndex, batch] of chunk(trackedOrders, 100).entries()) {
            let statuses: Awaited<ReturnType<typeof getStatusDocuments>>;

            try {
                statuses = await getStatusDocuments(batch.map((order) => ({
                    Number: order.ttnNumber.trim(),
                    Ref: order.ttnRef.trim(),
                })));
            } catch (error: unknown) {
                errors += 1;
                console.error("[TTN cron] Nova Poshta batch failed", {
                    batch: batchIndex + 1,
                    orders: batch.length,
                    error,
                });
                continue;
            }

            const ordersByNumber = new Map(batch.map((order) => [order.ttnNumber.trim(), order]));
            const ordersByRef = new Map(batch.map((order) => [order.ttnRef.trim(), order]));
            const updatedAt = new Date();
            const updateResults = await Promise.allSettled(statuses.map(async (statusDocument) => {
                const order = (statusDocument.Number ? ordersByNumber.get(statusDocument.Number) : undefined)
                    ?? (statusDocument.RefEW ? ordersByRef.get(statusDocument.RefEW) : undefined);

                if (!order) {
                    throw new Error(`No order found for TTN ${statusDocument.Number ?? statusDocument.RefEW}`);
                }

                const status = mapNPStatusToOrderStatus(statusDocument.StatusCode, order.status);

                await prisma.order.update({
                    where: {id: order.id},
                    data: {
                        ttnStatus: statusDocument.Status,
                        ttnStatusCode: String(statusDocument.StatusCode),
                        ttnStatusUpdatedAt: updatedAt,
                        ...(status === null ? {} : {status}),
                    },
                });
            }));

            for (const [resultIndex, result] of updateResults.entries()) {
                if (result.status === "fulfilled") {
                    processedOrders += 1;
                    continue;
                }

                errors += 1;
                console.error("[TTN cron] Order update failed", {
                    batch: batchIndex + 1,
                    result: resultIndex + 1,
                    error: result.reason,
                });
            }
        }
    } catch (error: unknown) {
        errors += 1;
        console.error("[TTN cron] Processing failed", error);
    } finally {
        console.log("[TTN cron] Processing completed", {
            totalOrders,
            processedOrders,
            errors,
        });
    }
}

export function GET(request: Request) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    after(processTtnUpdates);

    return NextResponse.json({status: "accepted"}, {status: 202});
}
