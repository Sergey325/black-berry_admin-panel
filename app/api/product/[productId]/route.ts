import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {tryInvalidateStorefrontCache} from "@/app/lib/storefrontCache";

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
        const cacheInvalidated = await tryInvalidateStorefrontCache(["products", "categories"]);

        return NextResponse.json({cacheInvalidated}, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(error, { status: 500 });
    }
}
