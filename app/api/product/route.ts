import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, name, description, price, discount, colors, slug, materialId, categoryId, relatedProducts, quantity } = body;
        const productId = Number(id)

        const colorsData = colors?.map((c: {
            color: string;
            colorName: string;
            isBestSeller: boolean;
            images: string[];
            sizes: { size: string; available: boolean }[];
        }) => ({
            color: c.color,
            colorName: c.colorName,
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
                })),
            },
        }));

        const relatedIds: number[] = relatedProducts?.map(
            (r: { id: number; imageUrl: string; name: string }) => r.id
        ) ?? [];

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
                    discount,
                    materialId,
                    categoryId,
                    quantity,
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
                    discount,
                    materialId,
                    categoryId,
                    quantity,
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