import {OrderStatus, PaymentMethod} from "@prisma/client";

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
    PENDING: ["PAID", "CANCELLED"],
    PAID: ["PROCESSING", "SHIPPED", "ARRIVED", "DELIVERED", "CANCELLED", "REFUNDED"],
    PROCESSING: ["SHIPPED", "ARRIVED", "DELIVERED", "CANCELLED", "REFUNDED"],
    SHIPPED: ["ARRIVED", "DELIVERED", "CANCELLED", "REFUNDED"],
    ARRIVED: ["DELIVERED", "CANCELLED", "REFUNDED"],
    DELIVERED: ["REFUNDED"],
    CANCELLED: ["REFUNDED"],
    REFUNDED: [],
};

export class OrderStatusError extends Error {}

export function canChangeOrderStatus(current: OrderStatus, next: OrderStatus) {
    return current === next || transitions[current].includes(next);
}

export function getOrderStatusUpdate(
    order: {status: OrderStatus; paidAt: Date | null; paymentMethod: PaymentMethod},
    status: OrderStatus,
    now = new Date(),
) {
    if (!canChangeOrderStatus(order.status, status)) {
        throw new OrderStatusError("Недопустимий перехід статусу замовлення");
    }
    if (status === OrderStatus.REFUNDED && order.paidAt === null) {
        throw new OrderStatusError("Неможливо повернути оплату неоплаченого замовлення");
    }
    const confirmsPayment = status === OrderStatus.PAID
        || status === OrderStatus.DELIVERED && order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY;
    return {status, paidAt: order.paidAt ?? (confirmsPayment ? now : null)};
}
