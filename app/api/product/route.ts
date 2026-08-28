import {NextResponse} from "next/server";
import prisma from "@/app/lib/prisma";
import {persistProduct} from "@/app/api/product/persist-product";
import {
    normalizeColors,
    normalizeSpecificationOverrides,
    parseProductRequest,
    ProductRequestError,
} from "@/app/api/product/product-request";
import {tryInvalidateStorefrontCache} from "@/app/lib/storefrontCache";

export async function POST(request: Request) {
    try {
        const rawBody: unknown = await request.json();
        const body = parseProductRequest(rawBody);
        const colors = normalizeColors(body.colors);
        const specificationOverrides = normalizeSpecificationOverrides(body.specificationOverrides);
        const transactionStartedAt = performance.now();
        const productId = await prisma.$transaction((transaction) => (
            persistProduct(transaction, body, colors, specificationOverrides)
        ));
        const transactionDurationMs = Math.round(performance.now() - transactionStartedAt);
        const cacheInvalidated = await tryInvalidateStorefrontCache(["products", "categories"]);

        return NextResponse.json({id: productId, transactionDurationMs, cacheInvalidated}, {status: 200});
    } catch (error) {
        if (error instanceof ProductRequestError) {
            return NextResponse.json({error: error.message}, {status: 400});
        }

        console.error(error);
        return NextResponse.json({error: "Не вдалося зберегти товар"}, {status: 500});
    }
}
