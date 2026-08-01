import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/app/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const bannerId = Number(id);

        if (!Number.isInteger(bannerId) || bannerId < 1) {
            return NextResponse.json({ error: "Некоректний ідентифікатор банера" }, { status: 400 });
        }

        await prisma.banner.delete({ where: { id: bannerId } });
        return NextResponse.json(null, { status: 200 });
    } catch (error) {
        console.error(error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return NextResponse.json({ error: "Банер не знайдено" }, { status: 404 });
        }
        return NextResponse.json({ error: "Не вдалося видалити банер" }, { status: 500 });
    }
}
