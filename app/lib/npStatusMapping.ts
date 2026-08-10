import {OrderStatus} from "@prisma/client";

const FINAL_ORDER_STATUSES = new Set<OrderStatus>([
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
]);

const SHIPPED_STATUS_CODES = new Set([
    "4",
    "5",
    "6",
    "12",
    "41",
    "101",
    "104",
    "111",
    "112",
]);

const ARRIVED_STATUS_CODES = new Set([
    "7",
    "8",
]);

const DELIVERED_STATUS_CODES = new Set([
    "9",
    "10",
    "11",
]);

export function mapNPStatusToOrderStatus(
    statusCode: string | number,
    currentStatus: OrderStatus,
): OrderStatus | null {
    if (FINAL_ORDER_STATUSES.has(currentStatus)) return null;

    const normalizedStatusCode = String(statusCode);
    if (DELIVERED_STATUS_CODES.has(normalizedStatusCode)) return OrderStatus.DELIVERED;
    if (normalizedStatusCode === "102" || normalizedStatusCode === "103") return OrderStatus.CANCELLED;
    if (ARRIVED_STATUS_CODES.has(normalizedStatusCode)) return OrderStatus.ARRIVED;
    if (SHIPPED_STATUS_CODES.has(normalizedStatusCode) && currentStatus !== OrderStatus.ARRIVED) {
        return OrderStatus.SHIPPED;
    }

    return null;
}
