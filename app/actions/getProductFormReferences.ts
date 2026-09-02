"use server";

import {getCatalogColors} from "@/app/actions/getCatalogColors";
import {getMaterials} from "@/app/actions/getMaterials";
import prisma from "@/app/lib/prisma";

export async function getProductFormReferences() {
    const [materials, categories, catalogColors] = await Promise.all([
        getMaterials(),
        prisma.category.findMany({
            orderBy: {id: "asc"},
            select: {
                id: true,
                name: true,
                coverImage: true,
                defaultSizes: true,
                specifications: {
                    orderBy: {order: "asc"},
                    select: {
                        id: true,
                        name: true,
                        value: true,
                    },
                },
            },
        }),
        getCatalogColors(),
    ]);

    return {
        materials,
        categories,
        catalogColors,
    };
}

export type ProductFormReferences = Awaited<ReturnType<typeof getProductFormReferences>>;
