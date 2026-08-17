import {NextResponse} from "next/server";
import {Prisma} from "@prisma/client";
import prisma from "@/app/lib/prisma";
import {FormValuesProduct} from "@/app/types";

type ProductRequest = FormValuesProduct & {
    id: number | null;
};

type ProductColorRequest = ProductRequest["colors"][number];

type ExistingColor = Prisma.ProductColorGetPayload<{
    include: {
        images: true;
        sizes: true;
    };
}>;

class ProductRequestError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === "object" && value !== null && !Array.isArray(value)
);

const readString = (value: unknown, field: string): string => {
    if (typeof value !== "string") {
        throw new ProductRequestError(`Поле ${field} має бути рядком`);
    }

    return value;
};

const readNumber = (value: unknown, field: string): number => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new ProductRequestError(`Поле ${field} має бути числом`);
    }

    return value;
};

const readPositiveInteger = (value: unknown, field: string): number => {
    const number = readNumber(value, field);

    if (!Number.isInteger(number) || number <= 0) {
        throw new ProductRequestError(`Поле ${field} має бути додатним цілим числом`);
    }

    return number;
};

const readOptionalPositiveInteger = (value: unknown, field: string): number | undefined => {
    if (value === undefined || value === null) {
        return undefined;
    }

    return readPositiveInteger(value, field);
};

const readNullableQuantity = (value: unknown, field: string): number | null => {
    if (value === null) {
        return null;
    }

    const number = readNumber(value, field);

    if (!Number.isInteger(number) || number < 0) {
        throw new ProductRequestError(`Поле ${field} має бути невід'ємним цілим числом або null`);
    }

    return number;
};

const parseColor = (value: unknown, index: number): ProductColorRequest => {
    if (!isRecord(value)) {
        throw new ProductRequestError(`Некоректний варіант кольору ${index + 1}`);
    }

    if (!Array.isArray(value.images) || !value.images.every((image) => typeof image === "string")) {
        throw new ProductRequestError(`Некоректні зображення варіанта ${index + 1}`);
    }

    if (!Array.isArray(value.catalogColorIds)) {
        throw new ProductRequestError(`Некоректні кольори для фільтрації варіанта ${index + 1}`);
    }

    const catalogColorIds = value.catalogColorIds.map((catalogColorId, catalogColorIndex) => (
        readPositiveInteger(catalogColorId, `colors.${index}.catalogColorIds.${catalogColorIndex}`)
    ));

    if (!Array.isArray(value.sizes)) {
        throw new ProductRequestError(`Некоректні розміри варіанта ${index + 1}`);
    }

    const sizes = value.sizes.map((size, sizeIndex) => {
        if (!isRecord(size) || typeof size.available !== "boolean") {
            throw new ProductRequestError(`Некоректний розмір ${sizeIndex + 1} варіанта ${index + 1}`);
        }

        return {
            id: readOptionalPositiveInteger(size.id, `colors.${index}.sizes.${sizeIndex}.id`),
            size: readString(size.size, `colors.${index}.sizes.${sizeIndex}.size`),
            available: size.available,
            quantity: readNullableQuantity(size.quantity, `colors.${index}.sizes.${sizeIndex}.quantity`),
        };
    });

    if (typeof value.isBestSeller !== "boolean") {
        throw new ProductRequestError(`Некоректне поле isBestSeller варіанта ${index + 1}`);
    }

    return {
        id: readOptionalPositiveInteger(value.id, `colors.${index}.id`),
        color: readString(value.color, `colors.${index}.color`),
        colorName: readString(value.colorName, `colors.${index}.colorName`),
        colorCode: typeof value.colorCode === "string" ? value.colorCode : null,
        catalogColorIds,
        isBestSeller: value.isBestSeller,
        images: value.images,
        sizes,
    };
};

const parseProductRequest = (value: unknown): ProductRequest => {
    if (!isRecord(value) || !Array.isArray(value.colors) || !Array.isArray(value.relatedProducts)) {
        throw new ProductRequestError("Некоректний payload товару");
    }

    const id = value.id === null ? null : readPositiveInteger(value.id, "id");
    const categoryId = value.categoryId === null ? null : readPositiveInteger(value.categoryId, "categoryId");
    const discount = value.discount === null ? null : readNumber(value.discount, "discount");

    if (typeof value.hasLining !== "boolean") {
        throw new ProductRequestError("Поле hasLining має бути boolean");
    }

    const relatedProducts = value.relatedProducts.map((relatedProduct, index) => {
        if (!isRecord(relatedProduct)) {
            throw new ProductRequestError(`Некоректний пов'язаний товар ${index + 1}`);
        }

        return {
            id: readPositiveInteger(relatedProduct.id, `relatedProducts.${index}.id`),
            name: readString(relatedProduct.name, `relatedProducts.${index}.name`),
            imageUrl: readString(relatedProduct.imageUrl, `relatedProducts.${index}.imageUrl`),
        };
    });

    return {
        id,
        name: readString(value.name, "name"),
        slug: readString(value.slug, "slug"),
        description: readString(value.description, "description"),
        price: readNumber(value.price, "price"),
        discount,
        hasLining: value.hasLining,
        materialId: readPositiveInteger(value.materialId, "materialId"),
        categoryId,
        colors: value.colors.map(parseColor),
        relatedProducts,
    };
};

const normalizeColors = (colors: ProductColorRequest[]): ProductColorRequest[] => {
    if (colors.length === 0) {
        throw new ProductRequestError("Додайте хоча б один варіант кольору");
    }

    const normalized = colors.map((color, index) => {
        const catalogColorIds = [...new Set(color.catalogColorIds)];

        if (catalogColorIds.length === 0) {
            throw new ProductRequestError(`Виберіть хоча б один колір для фільтрації варіанта ${index + 1}`);
        }

        if (color.images.length === 0 || color.sizes.length === 0) {
            throw new ProductRequestError(`Варіант ${index + 1} повинен мати зображення та розміри`);
        }

        return {...color, catalogColorIds};
    });
    const existingIds = normalized.flatMap((color) => color.id === undefined ? [] : [color.id]);

    if (new Set(existingIds).size !== existingIds.length) {
        throw new ProductRequestError("Варіанти кольору не повинні дублюватися");
    }

    return normalized;
};

const getNextProductPosition = async (
    transaction: Prisma.TransactionClient,
    categoryId: number | null,
    excludedProductId?: number,
): Promise<number> => {
    const result = await transaction.product.aggregate({
        where: {
            categoryId,
            id: excludedProductId ? {not: excludedProductId} : undefined,
        },
        _max: {position: true},
    });

    return (result._max.position ?? -1) + 1;
};

const createColorData = (
    color: ProductColorRequest,
    position: number,
    catalogColorCodes: Map<number, string>,
): Prisma.ProductColorCreateWithoutProductInput => ({
    color: color.color,
    colorName: color.colorName,
    colorCode: color.catalogColorIds.map((catalogColorId) => catalogColorCodes.get(catalogColorId)).join("|"),
    isBestSeller: color.isBestSeller,
    position,
    images: {
        create: color.images.map((url, order) => ({url, order})),
    },
    sizes: {
        create: color.sizes.map(({size, available, quantity}) => ({size, available, quantity})),
    },
    ProductColorFilter: {
        create: color.catalogColorIds.map((catalogColorId) => ({
            CatalogColor: {
                connect: {id: catalogColorId},
            },
        })),
    },
});

const reconcileImages = async (
    transaction: Prisma.TransactionClient,
    productColorId: number,
    requestedUrls: string[],
    existingImages: ExistingColor["images"],
): Promise<void> => {
    const availableByUrl = new Map<string, ExistingColor["images"]>();

    existingImages.forEach((image) => {
        availableByUrl.set(image.url, [...(availableByUrl.get(image.url) ?? []), image]);
    });

    const retainedIds = new Set<number>();
    const updates: Promise<unknown>[] = [];

    requestedUrls.forEach((url, order) => {
        const existingImage = availableByUrl.get(url)?.shift();

        if (existingImage) {
            retainedIds.add(existingImage.id);
            updates.push(transaction.productImage.update({
                where: {id: existingImage.id},
                data: {order},
            }));
            return;
        }

        updates.push(transaction.productImage.create({
            data: {productColorId, url, order},
        }));
    });

    const removedIds = existingImages.filter(({id}) => !retainedIds.has(id)).map(({id}) => id);

    if (removedIds.length > 0) {
        updates.push(transaction.productImage.deleteMany({where: {id: {in: removedIds}, productColorId}}));
    }

    await Promise.all(updates);
};

const reconcileSizes = async (
    transaction: Prisma.TransactionClient,
    productColorId: number,
    requestedSizes: ProductColorRequest["sizes"],
    existingSizes: ExistingColor["sizes"],
): Promise<void> => {
    const existingIds = new Set(existingSizes.map(({id}) => id));
    const requestedExistingIds = requestedSizes.flatMap((size) => size.id === undefined ? [] : [size.id]);

    if (new Set(requestedExistingIds).size !== requestedExistingIds.length || requestedExistingIds.some((id) => !existingIds.has(id))) {
        throw new ProductRequestError("Некоректні ідентифікатори розмірів");
    }

    const updates: Promise<unknown>[] = requestedSizes.map(({id, size, available, quantity}) => (
        id === undefined
            ? transaction.productSize.create({data: {productColorId, size, available, quantity}})
            : transaction.productSize.update({where: {id}, data: {size, available, quantity}})
    ));
    const retainedIds = new Set(requestedExistingIds);
    const removedIds = existingSizes.filter(({id}) => !retainedIds.has(id)).map(({id}) => id);

    if (removedIds.length > 0) {
        updates.push(transaction.productSize.deleteMany({where: {id: {in: removedIds}, productColorId}}));
    }

    await Promise.all(updates);
};

const updateExistingColor = async (
    transaction: Prisma.TransactionClient,
    color: ProductColorRequest,
    position: number,
    existingColor: ExistingColor,
    catalogColorCodes: Map<number, string>,
): Promise<void> => {
    const colorCode = color.catalogColorIds.map((catalogColorId) => catalogColorCodes.get(catalogColorId)).join("|");
    const data: Prisma.ProductColorUpdateInput = {
        color: color.color,
        colorName: color.colorName,
        colorCode,
        isBestSeller: color.isBestSeller,
        position,
        ProductColorFilter: {
            deleteMany: {},
            create: color.catalogColorIds.map((catalogColorId) => ({
                CatalogColor: {
                    connect: {id: catalogColorId},
                },
            })),
        },
    };

    await transaction.productColor.update({
        where: {id: existingColor.id},
        data,
    });
    await Promise.all([
        reconcileImages(transaction, existingColor.id, color.images, existingColor.images),
        reconcileSizes(transaction, existingColor.id, color.sizes, existingColor.sizes),
    ]);
};

export async function POST(request: Request) {
    try {
        const rawBody: unknown = await request.json();
        const body = parseProductRequest(rawBody);
        const colors = normalizeColors(body.colors);

        const finalProductId = await prisma.$transaction(async (transaction): Promise<number> => {
            const requestedCatalogColorIds = [...new Set(colors.flatMap(({catalogColorIds}) => catalogColorIds))];
            const catalogColors: {id: number; code: string}[] = await transaction.catalogColor.findMany({
                where: {id: {in: requestedCatalogColorIds}},
                select: {id: true, code: true},
            });

            if (catalogColors.length !== requestedCatalogColorIds.length) {
                throw new ProductRequestError("Один або кілька кольорів для фільтрації не існують");
            }

            const catalogColorCodes = new Map(catalogColors.map(({id, code}) => [id, code]));
            let productId: number;

            if (body.id === null) {
                const position = await getNextProductPosition(transaction, body.categoryId);
                const data: Prisma.ProductCreateInput = {
                    name: body.name,
                    description: body.description,
                    slug: body.slug,
                    price: body.price,
                    discount: body.discount ?? 0,
                    hasLining: body.hasLining,
                    position,
                    material: {connect: {id: body.materialId}},
                    category: body.categoryId === null ? undefined : {connect: {id: body.categoryId}},
                    colors: {
                        create: colors.map((color, colorIndex) => createColorData(color, colorIndex, catalogColorCodes)),
                    },
                };
                const created: {id: number} = await transaction.product.create({data, select: {id: true}});
                productId = created.id;
            } else {
                const existingProduct = await transaction.product.findUnique({
                    where: {id: body.id},
                    include: {
                        colors: {
                            include: {
                                images: true,
                                sizes: true,
                            },
                        },
                    },
                });

                if (!existingProduct) {
                    throw new ProductRequestError("Товар не знайдено");
                }

                const existingColorsById = new Map(existingProduct.colors.map((color) => [color.id, color]));

                if (colors.some((color) => color.id !== undefined && !existingColorsById.has(color.id))) {
                    throw new ProductRequestError("Один або кілька варіантів кольору не належать товару");
                }

                const position = existingProduct.categoryId === body.categoryId
                    ? undefined
                    : await getNextProductPosition(transaction, body.categoryId, body.id);
                const data: Prisma.ProductUpdateInput = {
                    name: body.name,
                    description: body.description,
                    slug: body.slug,
                    price: body.price,
                    discount: body.discount ?? 0,
                    hasLining: body.hasLining,
                    position,
                    material: {connect: {id: body.materialId}},
                    category: body.categoryId === null ? {disconnect: true} : {connect: {id: body.categoryId}},
                };

                await transaction.product.update({where: {id: body.id}, data});

                for (const [colorIndex, color] of colors.entries()) {
                    if (color.id === undefined) {
                        await transaction.productColor.create({
                            data: {
                                ...createColorData(color, colorIndex, catalogColorCodes),
                                product: {connect: {id: body.id}},
                            },
                        });
                        continue;
                    }

                    const existingColor = existingColorsById.get(color.id);

                    if (!existingColor) {
                        throw new ProductRequestError("Варіант кольору не знайдено");
                    }

                    await updateExistingColor(transaction, color, colorIndex, existingColor, catalogColorCodes);
                }

                const retainedColorIds = new Set(colors.flatMap((color) => color.id === undefined ? [] : [color.id]));
                const removedColorIds = existingProduct.colors.filter(({id}) => !retainedColorIds.has(id)).map(({id}) => id);

                if (removedColorIds.length > 0) {
                    await transaction.productColor.deleteMany({
                        where: {productId: body.id, id: {in: removedColorIds}},
                    });
                }

                productId = body.id;
            }

            const relatedIds = [...new Set(body.relatedProducts.map(({id}) => id))].filter((id) => id !== productId);

            await transaction.productRelation.deleteMany({where: {fromProductId: productId}});

            if (relatedIds.length > 0) {
                await transaction.productRelation.createMany({
                    data: relatedIds.map((toProductId, order) => ({fromProductId: productId, toProductId, order})),
                    skipDuplicates: true,
                });
            }

            return productId;
        });

        return NextResponse.json({id: finalProductId}, {status: 200});
    } catch (error) {
        if (error instanceof ProductRequestError) {
            return NextResponse.json({error: error.message}, {status: 400});
        }

        console.error(error);
        return NextResponse.json({error: "Не вдалося зберегти товар"}, {status: 500});
    }
}
