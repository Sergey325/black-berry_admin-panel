import type {Order, OrderItem as StoredOrderItem, PaymentMethod, PaymentSource} from "@prisma/client";

type DocumentItem = Pick<StoredOrderItem, "name" | "color" | "colorName" | "size" | "price" | "quantity">;

export type OrderDocumentData = Pick<Order, "firstName" | "lastName" | "phone" | "cityRef" | "warehouseRef" |
    "warehouse" | "paymentMethod" | "paymentSource" | "totalAmount" | "ttnNumber"> & {items: DocumentItem[]};

export type OrderDocumentChanges = {
    ttn: "create" | "update" | "link" | null;
    receipt: "create" | "replace" | null;
};

export function getReceiptLines(items: DocumentItem[]) {
    return items.map((item) => {
        const variant = [item.colorName?.trim() || item.color?.trim(), item.size?.trim()].filter(Boolean);
        const name = item.name.trim();
        return {
            name: variant.length ? `${name} (${variant.join(", ")})` : name,
            price: Math.round(item.price * 100),
            quantity: item.quantity * 1000,
        };
    }).sort((a, b) => a.name.localeCompare(b.name, "uk") || a.price - b.price || a.quantity - b.quantity);
}

export function getOrderItemsAmount(items: DocumentItem[]) {
    return items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;
}

export function getShipmentData(order: OrderDocumentData) {
    const cost = getOrderItemsAmount(order.items);

    return {
        recipientFirstName: order.firstName?.trim() || "",
        recipientLastName: order.lastName?.trim() || "",
        recipientPhone: order.phone?.replace(/\D/g, "").replace(/^0(?=\d{9}$)/, "380") || "",
        recipientCityRef: order.cityRef || "",
        recipientWarehouseRef: order.warehouseRef || "",
        serviceType: order.warehouse?.includes("Відділення") ? "WarehouseWarehouse" : "WarehousePostomat",
        cost,
        codAmount: order.paymentMethod === "CASH_ON_DELIVERY"
            ? Math.max(0, Math.round((cost - order.totalAmount) * 100)) / 100
            : 0,
        description: [...new Set(order.items.map((item) => item.name.trim()))].sort().join(", "),
    };
}

function getReceiptData(order: OrderDocumentData, delivered: boolean): {
    items: ReturnType<typeof getReceiptLines>;
    paymentMethod: PaymentMethod;
    paymentSource: PaymentSource;
    prepayment: number | null;
    ttn: string | null;
} {
    return {
        items: getReceiptLines(order.items),
        paymentMethod: order.paymentMethod,
        paymentSource: order.paymentSource,
        prepayment: order.paymentMethod === "CASH_ON_DELIVERY" && !delivered ? Math.round(order.totalAmount * 100) : null,
        ttn: order.paymentMethod === "CASH_ON_DELIVERY" ? order.ttnNumber : null,
    };
}

export function getOrderDocumentChanges(
    previous: OrderDocumentData & Pick<Order, "checkboxReceiptId" | "checkboxReceiptStatus" | "status">,
    next: OrderDocumentData,
    createReceipt: boolean,
): OrderDocumentChanges {
    const delivered = previous.status === "DELIVERED";
    const historicalShipment = delivered || previous.status === "CANCELLED" ||
        previous.status === "REFUNDED" || previous.status === "FAILED";
    const numberChanged = (previous.ttnNumber || null) !== next.ttnNumber;
    const shipment = getShipmentData(next);
    const shipmentChanged = JSON.stringify(getShipmentData(previous)) !== JSON.stringify(shipment);
    const hasReceipt = Boolean(previous.checkboxReceiptId || previous.checkboxReceiptStatus === "DONE");
    const receiptChanged = JSON.stringify(getReceiptData(previous, delivered)) !== JSON.stringify(getReceiptData(next, delivered));
    let ttn: OrderDocumentChanges["ttn"] = null;
    if (numberChanged) {
        ttn = "link";
    } else if (!historicalShipment && shipmentChanged && previous.ttnNumber) {
        ttn = "update";
    } else if (!historicalShipment && !next.ttnNumber &&
        (shipmentChanged || (!hasReceipt && createReceipt && next.paymentMethod === "CASH_ON_DELIVERY")) &&
        shipment.recipientFirstName && shipment.recipientLastName && shipment.recipientPhone &&
        shipment.recipientCityRef && shipment.recipientWarehouseRef) {
        ttn = "create";
    }

    return {
        ttn,
        receipt: hasReceipt ? (receiptChanged ? "replace" : null) : createReceipt ? "create" : null,
    };
}
