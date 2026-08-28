"use server";

import prisma from "@/app/lib/prisma";
import {verifyToken} from "@/app/lib/auth";
import {cookies} from "next/headers";
import {revalidatePath} from "next/cache";
import {tryInvalidateStorefrontCache} from "@/app/lib/storefrontCache";

export async function reorderBanners(bannerIds: number[]) {
    const token = (await cookies()).get("admin_session")?.value;
    const session = token ? await verifyToken(token) : null;

    if (!session) {
        throw new Error("Необхідна авторизація");
    }

    if (
        bannerIds.length === 0 ||
        bannerIds.some((id) => !Number.isInteger(id) || id <= 0) ||
        new Set(bannerIds).size !== bannerIds.length
    ) {
        throw new Error("Некоректний порядок банерів");
    }

    const banners = await prisma.banner.findMany({select: {id: true}});
    const existingIds = new Set(banners.map(({id}) => id));

    if (
        existingIds.size !== bannerIds.length ||
        bannerIds.some((id) => !existingIds.has(id))
    ) {
        throw new Error("Склад банерів змінився. Оновіть сторінку");
    }

    await prisma.$transaction(
        bannerIds.map((id, order) => prisma.banner.update({
            where: {id},
            data: {order},
        })),
    );
    const cacheInvalidated = await tryInvalidateStorefrontCache(["banners"]);

    revalidatePath("/banners");

    return {success: true, cacheInvalidated};
}
