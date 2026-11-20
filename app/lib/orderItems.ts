import type {Prisma} from "@prisma/client";
import type {OrderItem} from "@/app/types";

export class OrderItemError extends Error {}

type StockItem = {productSizeId: number | null; quantity: number; name: string};
export type OrderItemData = Prisma.OrderItemUncheckedCreateWithoutOrderInput & StockItem;

export async function resolveOrderProductSize(transaction: Prisma.TransactionClient, item: OrderItem) {
    if (item.productId == null || item.productColorId == null) {
        throw new OrderItemError("Оберіть товар та колір з каталогу");
    }

    const matches = await transaction.productSize.findMany({
        where: {
            size: item.size.trim(),
            productColorId: item.productColorId,
            productColor: {productId: item.productId},
        },
        select: {id: true},
        take: 2,
    });
    if (matches.length !== 1) {
        throw new OrderItemError(`Розмір товару «${item.name.trim()}» змінився. Оновіть сторінку`);
    }
    return matches[0].id;
}

export async function updateOrderStock(
    transaction: Prisma.TransactionClient,
    items: StockItem[],
    previousItems: StockItem[] = [],
) {
    const changes = new Map<number, {quantity: number; name: string}>();
    for (const [stockItems, direction] of [[previousItems, -1], [items, 1]] as const) {
        for (const {productSizeId, quantity, name} of stockItems) {
            if (productSizeId === null) continue;
            changes.set(productSizeId, {
                quantity: (changes.get(productSizeId)?.quantity ?? 0) + direction * quantity,
                name,
            });
        }
    }

    for (const [productSizeId, {quantity, name}] of [...changes].sort(([a], [b]) => a - b)) {
        if (quantity === 0) continue;
        if (quantity < 0) {
            await transaction.$executeRaw`
                UPDATE "ProductSize"
                SET
                    "quantity" = "quantity" - ${quantity},
                    "available" = "available" OR "quantity" = 0
                WHERE "id" = ${productSizeId} AND "quantity" IS NOT NULL
            `;
            continue;
        }

        const updatedCount = await transaction.$executeRaw`
            UPDATE "ProductSize"
            SET
                "quantity" = "quantity" - ${quantity},
                "available" = CASE
                    WHEN "quantity" IS NULL THEN "available"
                    ELSE "quantity" > ${quantity}
                END
            WHERE
                "id" = ${productSizeId}
                AND "available" = TRUE
                AND ("quantity" IS NULL OR "quantity" >= ${quantity})
        `;
        if (updatedCount !== 1) {
            throw new OrderItemError(`Недостатньо товару «${name}» у наявності`);
        }
    }
}

export async function reconcileOrderItems(transaction: Prisma.TransactionClient, orderId: number, items: OrderItem[]) {
    const existing = await transaction.orderItem.findMany({
        where: {orderId},
        include: {ProductSize: {select: {productColorId: true}}},
    });
    const existingById = new Map(existing.map((item) => [item.id, item]));
    const retainedIds = items.flatMap(({orderItemId}) => orderItemId === undefined ? [] : [orderItemId]);
    if (retainedIds.some((id) => !Number.isInteger(id) || !existingById.has(id)) || new Set(retainedIds).size !== retainedIds.length) {
        throw new OrderItemError("Позиції замовлення змінилися. Оновіть сторінку");
    }
    const previousStockItems: StockItem[] = [...existing];
    const updatedItems: {id: number | undefined; data: OrderItemData}[] = [];
    for (const item of items) {
        const previous = item.orderItemId === undefined ? undefined : existingById.get(item.orderItemId);
        const data = {
            productId: item.isCustom ? null : item.productId,
            name: item.name.trim(),
            price: item.price,
            quantity: item.quantity,
            color: item.color.trim() || null,
            colorCode: item.colorCode.trim() || null,
            colorName: item.colorName.trim() || null,
            size: item.size.trim() || null,
            imageUrl: item.imageUrl.trim() || null,
            isCustom: item.isCustom,
        };
        const sameVariant = previous && previous.productId === data.productId
            && previous.color === data.color && previous.colorCode === data.colorCode
            && previous.colorName === data.colorName && previous.size === data.size
            && previous.isCustom === data.isCustom
            && (!previous.ProductSize || item.productColorId == null
                || previous.ProductSize.productColorId === item.productColorId);
        let productSizeId = sameVariant ? previous.productSizeId : null;
        if (!item.isCustom && (!sameVariant || (productSizeId === null && item.quantity > previous.quantity))) {
            productSizeId = await resolveOrderProductSize(transaction, item);
            if (sameVariant) {
                previousStockItems.push({productSizeId, quantity: previous.quantity, name: previous.name});
            }
        }
        updatedItems.push({id: previous?.id, data: {...data, productSizeId}});
    }

    await updateOrderStock(transaction, updatedItems.map(({data}) => data), previousStockItems);
    for (const {id, data} of updatedItems) {
        if (id !== undefined) {
            await transaction.orderItem.update({where: {id, orderId}, data});
        } else {
            await transaction.orderItem.create({data: {...data, orderId}});
        }
    }
    await transaction.orderItem.deleteMany({where: {orderId, id: {in: existing.filter(({id}) => !retainedIds.includes(id)).map(({id}) => id)}}});
}
