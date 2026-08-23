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
        ProductColorFilter: {
            select: {
                catalogColorId: true;
            };
        };
    };
}>;

type ExistingRelation = {
    id: number;
    toProductId: number;
    order: number;
};

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
    const imagesToCreate: Prisma.ProductImageCreateManyInput[] = [];
    const imagesToReorder: {id: number; order: number}[] = [];

    requestedUrls.forEach((url, order) => {
        const existingImage = availableByUrl.get(url)?.shift();

        if (existingImage) {
            retainedIds.add(existingImage.id);

            if (existingImage.order !== order) {
                imagesToReorder.push({id: existingImage.id, order});
            }

            return;
        }

        imagesToCreate.push({productColorId, url, order});
    });

    const removedIds = existingImages.filter(({id}) => !retainedIds.has(id)).map(({id}) => id);

    if (imagesToCreate.length > 0) {
        await transaction.productImage.createMany({data: imagesToCreate});
    }

    for (const image of imagesToReorder) {
        await transaction.productImage.update({
            where: {id: image.id},
            data: {order: image.order},
        });
    }

    if (removedIds.length > 0) {
        await transaction.productImage.deleteMany({where: {id: {in: removedIds}, productColorId}});
    }
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

    const existingSizesById = new Map(existingSizes.map((size) => [size.id, size]));
    const sizesToCreate: Prisma.ProductSizeCreateManyInput[] = [];
    const sizesToUpdate: ProductColorRequest["sizes"] = [];

    requestedSizes.forEach((requestedSize) => {
        if (requestedSize.id === undefined) {
            sizesToCreate.push({
                productColorId,
                size: requestedSize.size,
                available: requestedSize.available,
                quantity: requestedSize.quantity,
            });
            return;
        }

        const existingSize = existingSizesById.get(requestedSize.id);

        if (
            existingSize
            && (
                existingSize.size !== requestedSize.size
                || existingSize.available !== requestedSize.available
                || existingSize.quantity !== requestedSize.quantity
            )
        ) {
            sizesToUpdate.push(requestedSize);
        }
    });

    const retainedIds = new Set(requestedExistingIds);
    const removedIds = existingSizes.filter(({id}) => !retainedIds.has(id)).map(({id}) => id);

    if (sizesToCreate.length > 0) {
        await transaction.productSize.createMany({data: sizesToCreate});
    }

    for (const size of sizesToUpdate) {
        await transaction.productSize.update({
            where: {id: size.id},
            data: {
                size: size.size,
                available: size.available,
                quantity: size.quantity,
            },
        });
    }

    if (removedIds.length > 0) {
        await transaction.productSize.deleteMany({where: {id: {in: removedIds}, productColorId}});
    }
};

const reconcileColorFilters = async (
    transaction: Prisma.TransactionClient,
    productColorId: number,
    requestedCatalogColorIds: number[],
    existingFilters: ExistingColor["ProductColorFilter"],
): Promise<void> => {
    const existingCatalogColorIds = new Set(existingFilters.map(({catalogColorId}) => catalogColorId));
    const requestedCatalogColorIdSet = new Set(requestedCatalogColorIds);
    const removedCatalogColorIds = existingFilters
        .map(({catalogColorId}) => catalogColorId)
        .filter((catalogColorId) => !requestedCatalogColorIdSet.has(catalogColorId));
    const addedCatalogColorIds = requestedCatalogColorIds
        .filter((catalogColorId) => !existingCatalogColorIds.has(catalogColorId));

    if (removedCatalogColorIds.length > 0) {
        await transaction.productColorFilter.deleteMany({
            where: {
                productColorId,
                catalogColorId: {in: removedCatalogColorIds},
            },
        });
    }

    if (addedCatalogColorIds.length > 0) {
        await transaction.productColorFilter.createMany({
            data: addedCatalogColorIds.map((catalogColorId) => ({productColorId, catalogColorId})),
        });
    }
};

const updateExistingColor = async (
    transaction: Prisma.TransactionClient,
    color: ProductColorRequest,
    position: number,
    existingColor: ExistingColor,
    catalogColorCodes: Map<number, string>,
): Promise<void> => {
    const colorCode = color.catalogColorIds.map((catalogColorId) => catalogColorCodes.get(catalogColorId)).join("|");
    const data: Prisma.ProductColorUpdateInput = {};

    if (existingColor.color !== color.color) data.color = color.color;
    if (existingColor.colorName !== color.colorName) data.colorName = color.colorName;
    if (existingColor.colorCode !== colorCode) data.colorCode = colorCode;
    if (existingColor.isBestSeller !== color.isBestSeller) data.isBestSeller = color.isBestSeller;
    if (existingColor.position !== position) data.position = position;

    if (Object.keys(data).length > 0) {
        await transaction.productColor.update({
            where: {id: existingColor.id},
            data,
        });
    }

    await reconcileColorFilters(transaction, existingColor.id, color.catalogColorIds, existingColor.ProductColorFilter);
    await reconcileImages(transaction, existingColor.id, color.images, existingColor.images);
    await reconcileSizes(transaction, existingColor.id, color.sizes, existingColor.sizes);
};

const reconcileRelations = async (
    transaction: Prisma.TransactionClient,
    productId: number,
    requestedRelatedIds: number[],
    existingRelations: ExistingRelation[],
): Promise<void> => {
    const existingRelationsByProductId = new Map(existingRelations.map((relation) => [relation.toProductId, relation]));
    const retainedIds = new Set<number>();
    const relationsToCreate: Prisma.ProductRelationCreateManyInput[] = [];
    const relationsToReorder: {id: number; order: number}[] = [];

    requestedRelatedIds.forEach((toProductId, order) => {
        const existingRelation = existingRelationsByProductId.get(toProductId);

        if (!existingRelation) {
            relationsToCreate.push({fromProductId: productId, toProductId, order});
            return;
        }

        retainedIds.add(existingRelation.id);

        if (existingRelation.order !== order) {
            relationsToReorder.push({id: existingRelation.id, order});
        }
    });

    const removedIds = existingRelations.filter(({id}) => !retainedIds.has(id)).map(({id}) => id);

    if (removedIds.length > 0) {
        await transaction.productRelation.deleteMany({where: {id: {in: removedIds}, fromProductId: productId}});
    }

    if (relationsToCreate.length > 0) {
        await transaction.productRelation.createMany({data: relationsToCreate});
    }

    for (const relation of relationsToReorder) {
        await transaction.productRelation.update({
            where: {id: relation.id},
            data: {order: relation.order},
        });
    }
};

export async function POST(request: Request) {
    try {
        const rawBody: unknown = await request.json();
        const body = parseProductRequest(rawBody);
        const colors = normalizeColors(body.colors);
        const requestedCatalogColorIds = [...new Set(colors.flatMap(({catalogColorIds}) => catalogColorIds))];
        const catalogColors: {id: number; code: string}[] = await prisma.catalogColor.findMany({
            where: {id: {in: requestedCatalogColorIds}},
            select: {id: true, code: true},
        });

        if (catalogColors.length !== requestedCatalogColorIds.length) {
            throw new ProductRequestError("Один або кілька кольорів для фільтрації не існують");
        }

        const catalogColorCodes = new Map(catalogColors.map(({id, code}) => [id, code]));
        const transactionStartedAt = performance.now();
        const finalProductId = await prisma.$transaction(async (transaction): Promise<number> => {
            let productId: number;
            let existingRelations: ExistingRelation[] = [];

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
                                ProductColorFilter: {
                                    select: {
                                        catalogColorId: true,
                                    },
                                },
                            },
                        },
                        relatedTo: {
                            select: {
                                id: true,
                                toProductId: true,
                                order: true,
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

                const discount = body.discount ?? 0;
                const data: Prisma.ProductUpdateInput = {};

                if (existingProduct.name !== body.name) data.name = body.name;
                if ((existingProduct.description ?? "") !== body.description) data.description = body.description;
                if (existingProduct.slug !== body.slug) data.slug = body.slug;
                if (existingProduct.price !== body.price) data.price = body.price;
                if (existingProduct.discount !== discount) data.discount = discount;
                if (existingProduct.hasLining !== body.hasLining) data.hasLining = body.hasLining;
                if (existingProduct.materialId !== body.materialId) data.material = {connect: {id: body.materialId}};

                if (existingProduct.categoryId !== body.categoryId) {
                    data.position = await getNextProductPosition(transaction, body.categoryId, body.id);
                    data.category = body.categoryId === null
                        ? {disconnect: true}
                        : {connect: {id: body.categoryId}};
                }

                if (Object.keys(data).length > 0) {
                    await transaction.product.update({where: {id: body.id}, data});
                }

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
                existingRelations = existingProduct.relatedTo;
            }

            const relatedIds = [...new Set(body.relatedProducts.map(({id}) => id))].filter((id) => id !== productId);

            await reconcileRelations(transaction, productId, relatedIds, existingRelations);

            return productId;
        });
        const transactionDurationMs = Math.round(performance.now() - transactionStartedAt);

        return NextResponse.json({id: finalProductId, transactionDurationMs}, {status: 200});
    } catch (error) {
        if (error instanceof ProductRequestError) {
            return NextResponse.json({error: error.message}, {status: 400});
        }

        console.error(error);
        return NextResponse.json({error: "Не вдалося зберегти товар"}, {status: 500});
    }
}
