import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {Prisma} from "@prisma/client";
import {tryInvalidateStorefrontCache} from "@/app/lib/storefrontCache";

export async function POST(req: Request) {
    const { name } = await req.json();

    if (!name?.trim()) {
        return NextResponse.json({ error: "Назва обов'язкова" }, { status: 400 });
    }

    try {
        const material = await prisma.material.create({
            data: { name: name.trim() },
        });
        const cacheInvalidated = await tryInvalidateStorefrontCache(["products"]);
        return NextResponse.json({...material, cacheInvalidated}, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { error: "Матеріал з такою назвою вже існує" },
                { status: 409 }
            );
        }
        console.error(error);
        return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
    }
}
