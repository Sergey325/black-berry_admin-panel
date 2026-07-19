"use server";

import prisma from "@/app/lib/prisma";
import {Season} from "@prisma/client";

export interface ICategory {
    name: string
    id: number
    slug: string
    description: string
    productsDescription: string
    coverImage: string
    season: Season
    isOnMainPage: boolean | null
    hasLining: boolean | null
    specifications: {
        name: string
        id: number
        categoryId: number
        order: number
        value: string
    }[]
    _count: {
        products: number
    }
}

export async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                id: "asc",
            },
            include: {
                specifications: {
                    orderBy: {
                        order: "asc",
                    },
                },
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });

        return categories;
    } catch (error) {
        console.error("Failed to get categories:", error);

        throw new Error("Failed to get categories");
    }
}