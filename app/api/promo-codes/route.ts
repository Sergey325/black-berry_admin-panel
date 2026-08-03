import {Prisma, PromoScopeType} from "@prisma/client";
import {NextResponse} from "next/server";
import prisma from "@/app/lib/prisma";
import {getPromoCodes} from "@/app/actions/getPromoCodes";
import {parsePromoCodeInput} from "@/app/lib/promoCodeValidation";

const duplicateCodeResponse = () => NextResponse.json(
    {error: "A promo code with this code already exists"},
    {status: 409},
);

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url);
    const title = searchParams.get("title") ?? searchParams.get("search") ?? undefined;
    const promoCodes = await getPromoCodes({title});

    return NextResponse.json(promoCodes);
}

export async function POST(request: Request) {
    try {
        const parsed = parsePromoCodeInput(await request.json());
        if (!parsed.success) return NextResponse.json({error: parsed.error}, {status: 400});

        const {categoryIds, productIds, ...data} = parsed.data;
        const now = new Date();
        const promoCode = await prisma.promoCode.create({
            data: {
                ...data,
                updatedAt: now,
                PromoCodeCategory: data.scopeType === PromoScopeType.CATEGORY
                    ? {create: categoryIds.map((categoryId) => ({categoryId}))}
                    : undefined,
                PromoCodeProduct: data.scopeType === PromoScopeType.PRODUCT
                    ? {create: productIds.map((productId) => ({productId}))}
                    : undefined,
            },
            select: {id: true},
        });

        return NextResponse.json(promoCode, {status: 201});
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return duplicateCodeResponse();
        }
        console.error(error);
        return NextResponse.json({error: "Failed to create promo code"}, {status: 500});
    }
}
