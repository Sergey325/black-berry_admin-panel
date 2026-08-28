import { NextResponse } from "next/server";
import { Season } from "@prisma/client";
import prisma from "@/app/lib/prisma";
import {tryInvalidateStorefrontCache} from "@/app/lib/storefrontCache";

type Specification = { name: string; value: string };

const normalizeDefaultSizes = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((size): size is string => typeof size === "string")
        .map((size) => size.trim());
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const id = Number(body.id);
        const specifications: Specification[] = (body.specifications ?? []).map((specification: Specification) => ({
            name: specification.name.trim(),
            value: specification.value.trim(),
        }));
        const defaultSizes = normalizeDefaultSizes(body.defaultSizes);

        if (!body.name?.trim() || !body.slug?.trim() || !body.coverImage || !body.description?.trim() || !body.productsDescription?.trim()) {
            return NextResponse.json({ error: "Заповніть усі обов'язкові поля" }, { status: 400 });
        }

        if (!Object.values(Season).includes(body.season)) {
            return NextResponse.json({ error: "Некоректний сезон" }, { status: 400 });
        }

        if (specifications.some((specification) => !specification.name || !specification.value)) {
            return NextResponse.json({ error: "Заповніть усі характеристики" }, { status: 400 });
        }

        if (new Set(specifications.map((specification) => specification.name)).size !== specifications.length) {
            return NextResponse.json({ error: "Назви характеристик не повинні повторюватися" }, { status: 400 });
        }

        if (defaultSizes.some((size) => !size)) {
            return NextResponse.json({ error: "Заповніть усі розміри" }, { status: 400 });
        }

        if (new Set(defaultSizes).size !== defaultSizes.length) {
            return NextResponse.json({ error: "Розміри не повинні повторюватися" }, { status: 400 });
        }

        const data = {
            name: body.name.trim(),
            slug: body.slug.trim(),
            coverImage: body.coverImage,
            sizeGuideImage: body.sizeGuideImage?.trim() || null,
            season: body.season as Season,
            productsDescription: body.productsDescription.trim(),
            description: body.description.trim(),
            isOnMainPage: Boolean(body.isOnMainPage),
            isDecoration: Boolean(body.isDecoration),
            defaultSizes,
        };

        if (id) {
            await prisma.$transaction([
                prisma.categorySpecification.deleteMany({ where: { categoryId: id } }),
                prisma.category.update({
                    where: { id },
                    data: {
                        ...data,
                        specifications: {
                            create: specifications.map((specification, order) => ({ ...specification, order })),
                        },
                    },
                }),
            ]);
        } else {
            await prisma.category.create({
                data: {
                    ...data,
                    specifications: {
                        create: specifications.map((specification, order) => ({ ...specification, order })),
                    },
                },
            });
        }
        const cacheInvalidated = await tryInvalidateStorefrontCache(["categories", "products"]);

        return NextResponse.json({cacheInvalidated}, { status: 200 });
    } catch (error: unknown) {
        console.error(error);
        if ((error as { code?: string }).code === "P2002") {
            return NextResponse.json({ error: "Категорія з такою назвою вже існує" }, { status: 409 });
        }
        return NextResponse.json({ error: "Не вдалося зберегти категорію" }, { status: 500 });
    }
}
