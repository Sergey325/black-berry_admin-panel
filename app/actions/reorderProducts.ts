"use server";

import prisma from "@/app/lib/prisma";
import {verifyToken} from "@/app/lib/auth";
import {cookies} from "next/headers";
import {revalidatePath} from "next/cache";
import {tryInvalidateStorefrontCache} from "@/app/lib/storefrontCache";

export async function reorderProducts(categoryId: number, productIds: number[]) {
    const token = (await cookies()).get("admin_session")?.value;
    const session = token ? await verifyToken(token) : null;

    if (!session) {
        throw new Error("Необхідна авторизація");
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new Error("Некоректна категорія");
    }

    if (
        productIds.length === 0 ||
        productIds.some((id) => !Number.isInteger(id) || id <= 0) ||
        new Set(productIds).size !== productIds.length
    ) {
        throw new Error("Некоректний порядок товарів");
    }

    const categoryProducts = await prisma.product.findMany({
        where: {categoryId},
        select: {id: true},
    });
    const categoryProductIds = new Set(categoryProducts.map(({id}) => id));

    if (
        categoryProductIds.size !== productIds.length ||
        productIds.some((id) => !categoryProductIds.has(id))
    ) {
        throw new Error("Склад категорії змінився. Оновіть сторінку");
    }

    await prisma.$transaction(
        productIds.map((id, position) => prisma.product.update({
            where: {id},
            data: {position},
        })),
    );
    const cacheInvalidated = await tryInvalidateStorefrontCache(["products", "categories"]);

    revalidatePath("/products");

    return {success: true, cacheInvalidated};
}
