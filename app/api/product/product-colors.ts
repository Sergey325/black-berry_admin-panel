import {Prisma} from "@prisma/client";
import {
    ProductRequestError,
    type ProductColorRequest,
} from "@/app/api/product/product-request";

export const productColorInclude = {
    images: true,
    sizes: true,
    ProductColorFilter: {
        select: {
            catalogColorId: true,
        },
    },
} satisfies Prisma.ProductColorInclude;

export type ExistingColor = Prisma.ProductColorGetPayload<{
    include: typeof productColorInclude;
}>;

export const getCatalogColorCodes = async (
    transaction: Prisma.TransactionClient,
    colors: ProductColorRequest[],
): Promise<Map<number, string>> => {
    const requestedCatalogColorIds = [...new Set(colors.flatMap(({catalogColorIds}) => catalogColorIds))];
    const catalogColors = await transaction.catalogColor.findMany({
        where: {id: {in: requestedCatalogColorIds}},
        select: {id: true, code: true},
    });

    if (catalogColors.length !== requestedCatalogColorIds.length) {
        throw new ProductRequestError("Один або кілька кольорів для фільтрації не існують");
    }

    return new Map(catalogColors.map(({id, code}) => [id, code]));
};

export const createColorData = (
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

    if (
        new Set(requestedExistingIds).size !== requestedExistingIds.length
        || requestedExistingIds.some((id) => !existingIds.has(id))
    ) {
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

export const reconcileProductColors = async (
    transaction: Prisma.TransactionClient,
    productId: number,
    requestedColors: ProductColorRequest[],
    existingColors: ExistingColor[],
    catalogColorCodes: Map<number, string>,
): Promise<void> => {
    const existingColorsById = new Map(existingColors.map((color) => [color.id, color]));

    if (requestedColors.some((color) => color.id !== undefined && !existingColorsById.has(color.id))) {
        throw new ProductRequestError("Один або кілька варіантів кольору не належать товару");
    }

    for (const [colorIndex, color] of requestedColors.entries()) {
        if (color.id === undefined) {
            await transaction.productColor.create({
                data: {
                    ...createColorData(color, colorIndex, catalogColorCodes),
                    product: {connect: {id: productId}},
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

    const retainedColorIds = new Set(requestedColors.flatMap((color) => color.id === undefined ? [] : [color.id]));
    const removedColorIds = existingColors.filter(({id}) => !retainedColorIds.has(id)).map(({id}) => id);

    if (removedColorIds.length > 0) {
        await transaction.productColor.deleteMany({
            where: {productId, id: {in: removedColorIds}},
        });
    }
};
