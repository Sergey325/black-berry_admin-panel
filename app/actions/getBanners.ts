"use server";

import prisma from "@/app/lib/prisma";

export interface IBanner {
    id: number;
    image: string;
    badge: string | null;
    title: string;
    features: string[];
    ctaHref: string | null;
    ctaLabel: string | null;
    order: number;
}

export interface IBannersParams {
    title?: string;
}

export async function getBanners(params?: IBannersParams): Promise<IBanner[]> {
    try{
        const title = params?.title?.trim();

        return prisma.banner.findMany({
            where: title ? { title: { contains: title, mode: "insensitive" } } : undefined,
            orderBy: [{ order: "asc" }, { id: "asc" }],
        });
    } catch (error) {
        console.error("Failed to get banners:", error);

        throw new Error("Failed to get banners");
    }
}

