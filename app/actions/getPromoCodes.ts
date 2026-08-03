"use server";

import prisma from "@/app/lib/prisma";

export type PromoScope = "ALL" | "CATEGORY" | "PRODUCT";

export interface PromoCodeListItem {
    id: number;
    code: string;
    discountPercent: number;
    scopeType: PromoScope;
    startsAt: Date | null;
    expiresAt: Date | null;
    maxUses: number | null;
    usedCount: number;
    isActive: boolean;
    createdAt: Date;
}

export interface PromoSelectOption {
    id: number;
    label: string;
    imageUrl?: string;
}

export interface PromoCodesParams {
    title?: string;
}

export async function getPromoCodes(params?: PromoCodesParams): Promise<PromoCodeListItem[]> {
    const search = params?.title?.trim();

    return prisma.promoCode.findMany({
        where: {
            isDeleted: false,
            ...(search ? {code: {contains: search, mode: "insensitive" as const}} : {}),
        },
        select: {
            id: true,
            code: true,
            discountPercent: true,
            scopeType: true,
            startsAt: true,
            expiresAt: true,
            maxUses: true,
            usedCount: true,
            isActive: true,
            createdAt: true,
        },
        orderBy: {createdAt: "desc"},
    });
}

export async function getPromoCodeOptions(): Promise<{
    categories: PromoSelectOption[];
    products: PromoSelectOption[];
}> {
    const [categories, products] = await Promise.all([
        prisma.category.findMany({
            select: {id: true, name: true, coverImage: true},
            orderBy: {name: "asc"},
        }),
        prisma.product.findMany({
            select: {
                id: true,
                name: true,
                colors: {
                    take: 1,
                    select: {images: {take: 1, orderBy: {order: "asc"}, select: {url: true}}},
                },
            },
            orderBy: {name: "asc"},
        }),
    ]);

    return {
        categories: categories.map((category) => ({
            id: category.id,
            label: category.name,
            imageUrl: category.coverImage,
        })),
        products: products.map((product) => ({
            id: product.id,
            label: product.name,
            imageUrl: product.colors[0]?.images[0]?.url,
        })),
    };
}
