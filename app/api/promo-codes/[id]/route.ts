import {Prisma, PromoScopeType} from "@prisma/client";
import {NextResponse} from "next/server";
import prisma from "@/app/lib/prisma";
import {parsePromoCodeInput} from "@/app/lib/promoCodeValidation";

type PromoCodeRouteContext = {params: Promise<{id: string}>};

const getId = async ({params}: PromoCodeRouteContext) => {
    const id = Number((await params).id);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const duplicateCodeResponse = () => NextResponse.json(
    {error: "A promo code with this code already exists"},
    {status: 409},
);

export async function GET(_request: Request, context: PromoCodeRouteContext) {
    const id = await getId(context);
    if (!id) return NextResponse.json({error: "Invalid promo code ID"}, {status: 400});

    const promoCode = await prisma.promoCode.findFirst({
        where: {id, isDeleted: false},
        include: {
            PromoCodeCategory: {include: {Category: {select: {id: true, name: true, coverImage: true}}}},
            PromoCodeProduct: {include: {Product: {select: {id: true, name: true}}}},
        },
    });

    if (!promoCode) return NextResponse.json({error: "Promo code not found"}, {status: 404});

    return NextResponse.json({
        id: promoCode.id,
        code: promoCode.code,
        discountPercent: promoCode.discountPercent,
        scopeType: promoCode.scopeType,
        startsAt: promoCode.startsAt,
        expiresAt: promoCode.expiresAt,
        maxUses: promoCode.maxUses,
        usedCount: promoCode.usedCount,
        isActive: promoCode.isActive,
        categories: promoCode.PromoCodeCategory.map(({Category}) => ({
            id: Category.id,
            label: Category.name,
            imageUrl: Category.coverImage,
        })),
        products: promoCode.PromoCodeProduct.map(({Product}) => ({
            id: Product.id,
            label: Product.name,
        })),
    });
}

export async function PATCH(request: Request, context: PromoCodeRouteContext) {
    const id = await getId(context);
    if (!id) return NextResponse.json({error: "Invalid promo code ID"}, {status: 400});

    try {
        const body: unknown = await request.json();
        if (typeof body === "object" && body !== null && Object.keys(body).length === 1 && typeof (body as {isActive?: unknown}).isActive === "boolean") {
            const promoCode = await prisma.promoCode.update({
                where: {id, isDeleted: false},
                data: {isActive: (body as {isActive: boolean}).isActive, updatedAt: new Date()},
                select: {id: true, isActive: true},
            });
            return NextResponse.json(promoCode);
        }

        const parsed = parsePromoCodeInput(body);
        if (!parsed.success) return NextResponse.json({error: parsed.error}, {status: 400});

        const {categoryIds, productIds, ...data} = parsed.data;
        const operations: Prisma.PrismaPromise<unknown>[] = [
            prisma.promoCode.update({
                where: {id, isDeleted: false},
                data: {...data, updatedAt: new Date()},
            }),
            prisma.promoCodeCategory.deleteMany({where: {promoCodeId: id}}),
            prisma.promoCodeProduct.deleteMany({where: {promoCodeId: id}}),
        ];

        if (data.scopeType === PromoScopeType.CATEGORY) {
            operations.push(prisma.promoCodeCategory.createMany({
                data: categoryIds.map((categoryId) => ({promoCodeId: id, categoryId})),
                skipDuplicates: true,
            }));
        }
        if (data.scopeType === PromoScopeType.PRODUCT) {
            operations.push(prisma.promoCodeProduct.createMany({
                data: productIds.map((productId) => ({promoCodeId: id, productId})),
                skipDuplicates: true,
            }));
        }

        await prisma.$transaction(operations);
        return NextResponse.json({id});
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") return duplicateCodeResponse();
            if (error.code === "P2025") {
                return NextResponse.json({error: "Promo code not found"}, {status: 404});
            }
        }
        console.error(error);
        return NextResponse.json({error: "Failed to update promo code"}, {status: 500});
    }
}

export async function DELETE(_request: Request, context: PromoCodeRouteContext) {
    const id = await getId(context);
    if (!id) return NextResponse.json({error: "Invalid promo code ID"}, {status: 400});

    try {
        const existing = await prisma.promoCode.findFirst({
            where: {id, isDeleted: false},
            select: {code: true},
        });
        if (!existing) return NextResponse.json({error: "Promo code not found"}, {status: 404});

        await prisma.promoCode.update({
            where: {id},
            data: {
                isDeleted: true,
                code: `${existing.code}__deleted_${id}`,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(null, {status: 200});
    } catch (error: unknown) {
        console.error(error);
        return NextResponse.json({error: "Failed to delete promo code"}, {status: 500});
    }
}
