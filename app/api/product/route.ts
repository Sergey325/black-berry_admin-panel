import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {FormValuesProduct} from "@/app/types";

type ProductRequest = FormValuesProduct & {
    id: number | null;
};

export async function POST(request: Request) {
    try {
        const body = await request.json() as ProductRequest;
        const { id, name, description, price, discount, hasLining, colors, slug, materialId, categoryId, relatedProducts } = body;
        const productId = Number(id)

        const colorsData = colors.map((c) => ({
            color: c.color,
            colorName: c.colorName,
            colorCode: c.colorCode,
            isBestSeller: c.isBestSeller,
            images: {
                create: c.images.map((url: string, index: number) => ({
                    url,
                    order: index,
                })),
            },
            sizes: {
                create: c.sizes.map((s) => ({
                    size: s.size,
                    available: s.available,
                    quantity: s.quantity,
                })),
            },
        }));

        const relatedIds = relatedProducts.map((relatedProduct) => relatedProduct.id);

        let finalProductId: number;

        if (productId) {
            // удаляем старые цвета (каскадно удалятся их картинки и размеры)
            await prisma.productColor.deleteMany({
                where: { productId: productId },
            });

            await prisma.product.update({
                where: { id: productId },
                data: {
                    name,
                    description,
                    slug,
                    price,
                    discount: discount ?? 0,
                    hasLining: Boolean(hasLining),
                    materialId,
                    categoryId,
                    colors: {
                        create: colorsData,
                    },
                },
            });

            finalProductId = productId;
        } else {
            const created = await prisma.product.create({
                data: {
                    name,
                    description,
                    slug,
                    price,
                    discount: discount ?? 0,
                    hasLining: Boolean(hasLining),
                    materialId,
                    categoryId,
                    colors: {
                        create: colorsData,
                    },
                },
            });

            finalProductId = created.id;
        }

        // пересоздаём связи с related products
        await prisma.productRelation.deleteMany({
            where: { fromProductId: finalProductId },
        });

        if (relatedIds.length > 0) {
            await prisma.productRelation.createMany({
                data: relatedIds.map((toProductId, index) => ({
                    fromProductId: finalProductId,
                    toProductId,
                    order: index,
                })),
                skipDuplicates: true,
            });
        }

        return NextResponse.json(null, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(error, { status: 500 });
    }
}
