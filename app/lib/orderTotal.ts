import type {IOrder} from "@/app/actions/getOrders";

type OrderAmount = Pick<IOrder, "paymentMethod" | "totalAmount"> & {
    items: Pick<IOrder["items"][number], "price" | "quantity">[];
};

export const CASH_ON_DELIVERY_PREPAYMENT_AMOUNT = 150;

export function getOrderFullAmount(order: OrderAmount): number {
    if (order.paymentMethod !== "CASH_ON_DELIVERY" || order.items.length === 0) {
        return order.totalAmount;
    }

    const itemsAmount = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return Math.max(0, itemsAmount);
}
