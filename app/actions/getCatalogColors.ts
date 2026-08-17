"use server";

import prisma from "@/app/lib/prisma";
import {DEFAULT_CATALOG_COLORS} from "@/app/lib/defaultCatalogColors";

export interface ICatalogColor {
    id: number;
    code: string;
    name: string;
    hex: string;
}

export async function getCatalogColors(): Promise<ICatalogColor[]> {
    const colorCount = await prisma.catalogColor.count();

    if (colorCount === 0) {
        await prisma.$transaction(DEFAULT_CATALOG_COLORS.map((color) => prisma.catalogColor.upsert({
            where: {code: color.code},
            update: {
                name: color.name,
                hex: color.hex,
            },
            create: color,
        })));
    }

    return prisma.catalogColor.findMany({
        orderBy: {id: "asc"},
    });
}
