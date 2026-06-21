import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, name, description, price, discount, colors, slug } = body;

        const productId = Number(id)

        const colorsData = colors?.map((c: {
            color: string;
            images: string[];
            sizes: { size: string; available: boolean }[];
        }) => ({
            color: c.color,
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
                    colors: {
                        create: colorsData,
                    },
                },
            });
        } else {
            await prisma.product.create({
                data: {
                    name,
                    description,
                    slug,
                    price,
                    discount,
                    colors: {
                        create: colorsData,
                    },
                },
            });
        }

        return NextResponse.json(null, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(error, { status: 500 });
    }
}