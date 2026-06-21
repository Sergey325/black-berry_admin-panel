import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

interface IParams {
    productId: string;
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<IParams> }
) {
    try {
        const { productId } = await params;

        if (!productId) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        await prisma.product.delete({
            where: {
                id: Number(productId),
            },
        });

        return NextResponse.json(null, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(error, { status: 500 });
    }
}