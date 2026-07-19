import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";


export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { name } = await req.json();

    if (!name?.trim()) {
        return NextResponse.json({ error: "Назва обов'язкова" }, { status: 400 });
    }

    try {
        const material = await prisma.material.update({
            where: { id: Number(id) },
            data: { name: name.trim() },
        });
        return NextResponse.json(material);
    } catch (e: any) {
        if (e.code === "P2002") {
            return NextResponse.json(
                { error: "Матеріал з такою назвою вже існує" },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
    }
}


export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const materialId = Number(id);

    const productsCount = await prisma.product.count({
        where: { material: {id: materialId}},
    });

    if (productsCount > 0) {
        return NextResponse.json(
            { error: "Неможливо видалити: матеріал використовується у товарах" },
            { status: 409 }
        );
    }

    try {
        await prisma.material.delete({ where: { id: materialId } });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
    }
}