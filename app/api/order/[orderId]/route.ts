import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

interface IParams {
    orderId: string;
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<IParams> }
) {
    const { orderId } = await params;

    const body = await request.json();
    const { status } = body;

    if (!orderId || !status) {
        throw new Error("Invalid ID or Status");
    }

    await prisma.order.update({
        where: {
            id: Number(orderId),
        },
        data: {
            status,
        },
    });

    return NextResponse.json(null, { status: 200 });
}