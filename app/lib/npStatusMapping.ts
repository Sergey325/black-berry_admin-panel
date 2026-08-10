import {OrderStatus} from "@prisma/client";

const FINAL_ORDER_STATUSES = new Set<OrderStatus>([
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
]);

export function mapNPStatusToOrderStatus(
    statusCode: string | number,
    currentStatus: OrderStatus,
): OrderStatus | null {
    if (FINAL_ORDER_STATUSES.has(currentStatus)) return null;

    const normalizedStatusCode = String(statusCode);
    if (normalizedStatusCode === "102") return null;
    if (normalizedStatusCode === "44") return OrderStatus.DELIVERED;
    if (normalizedStatusCode === "41") return OrderStatus.CANCELLED;

    return OrderStatus.SHIPPED;
}
