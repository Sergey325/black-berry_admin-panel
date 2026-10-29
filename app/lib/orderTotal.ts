import type {IOrder} from "@/app/actions/getOrders";

type OrderAmount = Pick<IOrder, "paymentMethod" | "totalAmount"> & {
    items: Pick<IOrder["items"][number], "price" | "quantity">[];
};

export const MIN_COD_PREPAYMENT = 150;

export function calculateCodPrepayment(total: number, percent: number): number {
    if (!Number.isFinite(total) || total < 0) {
        throw new Error("Order total must be a finite non-negative amount");
    }
    if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) {
        throw new Error("Prepayment percent must be greater than 0 and less than 100");
    }

    const totalKopecks = Math.round(total * 100);
    const percentBasisPoints = Math.round(percent * 100);
    return Math.max(MIN_COD_PREPAYMENT, Math.ceil(totalKopecks * percentBasisPoints / 10_000_000) * 10);
}

export function getOrderFullAmount(order: OrderAmount): number {
    if (order.paymentMethod !== "CASH_ON_DELIVERY" || order.items.length === 0) {
        return order.totalAmount;
    }

    const itemsAmount = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return Math.max(0, itemsAmount);
}
