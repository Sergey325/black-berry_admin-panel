import type {Prisma} from "@prisma/client";
import type {OrderItem} from "@/app/types";

export class OrderItemError extends Error {}

export async function reconcileOrderItems(transaction: Prisma.TransactionClient, orderId: number, items: OrderItem[]) {
    const existing = await transaction.orderItem.findMany({where: {orderId}});
    const existingById = new Map(existing.map((item) => [item.id, item]));
    const retainedIds = items.flatMap(({orderItemId}) => orderItemId === undefined ? [] : [orderItemId]);
    if (retainedIds.some((id) => !Number.isInteger(id) || !existingById.has(id)) || new Set(retainedIds).size !== retainedIds.length) {
        throw new OrderItemError("Позиції замовлення змінилися. Оновіть сторінку");
    }
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
            && previous.isCustom === data.isCustom;
        let productSizeId = sameVariant ? previous.productSizeId : null;
        if (!sameVariant && !item.isCustom && item.productColorId !== null && data.productId !== null) {
            const size = await transaction.productSize.findFirst({
                where: {size: data.size ?? "", productColorId: item.productColorId, productColor: {productId: data.productId}},
                select: {id: true},
            });
            if (!size) throw new OrderItemError("Розмір товару змінився. Оновіть сторінку");
            productSizeId = size.id;
        }
        if (previous) {
            await transaction.orderItem.update({where: {id: previous.id, orderId}, data: {...data, productSizeId}});
        } else {
            await transaction.orderItem.create({data: {...data, productSizeId, orderId}});
        }
    }
    await transaction.orderItem.deleteMany({where: {orderId, id: {in: existing.filter(({id}) => !retainedIds.includes(id)).map(({id}) => id)}}});
}
