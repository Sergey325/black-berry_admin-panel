import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {tryInvalidateStorefrontCache} from "@/app/lib/storefrontCache";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const categoryId = Number(id);

        if (!Number.isInteger(categoryId)) {
            return NextResponse.json({ error: "Некоректний ідентифікатор категорії" }, { status: 400 });
        }

        await prisma.category.delete({ where: { id: categoryId } });
        const cacheInvalidated = await tryInvalidateStorefrontCache(["categories", "products"]);
        return NextResponse.json({cacheInvalidated}, { status: 200 });
    } catch (error: unknown) {
        console.error(error);
        if ((error as { code?: string }).code === "P2025") {
            return NextResponse.json({ error: "Категорію не знайдено" }, { status: 404 });
        }
        return NextResponse.json({ error: "Не вдалося видалити категорію" }, { status: 500 });
    }
}
