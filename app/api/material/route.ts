import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {Prisma} from "@prisma/client";

export async function POST(req: Request) {
    const { name } = await req.json();

    if (!name?.trim()) {
        return NextResponse.json({ error: "Назва обов'язкова" }, { status: 400 });
    }

    try {
        const material = await prisma.material.create({
            data: { name: name.trim() },
        });
        return NextResponse.json(material, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { error: "Матеріал з такою назвою вже існує" },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
    }
}
