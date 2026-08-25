import {Prisma} from "@prisma/client";
import {
    createColorData,
    getCatalogColorCodes,
    productColorInclude,
    reconcileProductColors,
} from "@/app/api/product/product-colors";
import {
    type ExistingRelation,
    existingRelationSelect,
    reconcileRelations,
} from "@/app/api/product/product-relations";
import {
    ProductRequestError,
    type ProductColorRequest,
    type ProductRequest,
    type ProductSpecificationOverrideRequest,
} from "@/app/api/product/product-request";
import {reconcileSpecificationOverrides} from "@/app/api/product/product-specification-overrides";

const existingProductInclude = {
    colors: {
        include: productColorInclude,
    },
    relatedTo: {
        select: existingRelationSelect,
    },
    ProductSpecificationOverride: {
        select: {
            categorySpecificationId: true,
        },
    },
} satisfies Prisma.ProductInclude;

type ExistingProduct = Prisma.ProductGetPayload<{
    include: typeof existingProductInclude;
}>;

type ProductState = {
    productId: number;
    existingRelations: ExistingRelation[];
    hasExistingOverrides: boolean;
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

const createProduct = async (
    transaction: Prisma.TransactionClient,
    body: ProductRequest,
    colors: ProductColorRequest[],
    catalogColorCodes: Map<number, string>,
): Promise<ProductState> => {
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
    const product = await transaction.product.create({data, select: {id: true}});

    return {
        productId: product.id,
        existingRelations: [],
        hasExistingOverrides: false,
    };
};

const updateProductFields = async (
    transaction: Prisma.TransactionClient,
    existingProduct: ExistingProduct,
    body: ProductRequest,
): Promise<void> => {
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
        data.position = await getNextProductPosition(transaction, body.categoryId, existingProduct.id);
        data.category = body.categoryId === null
            ? {disconnect: true}
            : {connect: {id: body.categoryId}};
    }

    if (Object.keys(data).length > 0) {
        await transaction.product.update({where: {id: existingProduct.id}, data});
    }
};

const updateProduct = async (
    transaction: Prisma.TransactionClient,
    body: ProductRequest & {id: number},
    colors: ProductColorRequest[],
    catalogColorCodes: Map<number, string>,
): Promise<ProductState> => {
    const existingProduct = await transaction.product.findUnique({
        where: {id: body.id},
        include: existingProductInclude,
    });

    if (!existingProduct) {
        throw new ProductRequestError("Товар не знайдено");
    }

    await updateProductFields(transaction, existingProduct, body);
    await reconcileProductColors(
        transaction,
        body.id,
        colors,
        existingProduct.colors,
        catalogColorCodes,
    );

    return {
        productId: body.id,
        existingRelations: existingProduct.relatedTo,
        hasExistingOverrides: existingProduct.ProductSpecificationOverride.length > 0,
    };
};

export const persistProduct = async (
    transaction: Prisma.TransactionClient,
    body: ProductRequest,
    colors: ProductColorRequest[],
    specificationOverrides: ProductSpecificationOverrideRequest[],
): Promise<number> => {
    const catalogColorCodes = await getCatalogColorCodes(transaction, colors);
    const productState = body.id === null
        ? await createProduct(transaction, body, colors, catalogColorCodes)
        : await updateProduct(transaction, {...body, id: body.id}, colors, catalogColorCodes);
    const relatedIds = [...new Set(body.relatedProducts.map(({id}) => id))]
        .filter((id) => id !== productState.productId);

    await reconcileRelations(
        transaction,
        productState.productId,
        relatedIds,
        productState.existingRelations,
    );
    await reconcileSpecificationOverrides(
        transaction,
        productState.productId,
        body.categoryId,
        specificationOverrides,
        productState.hasExistingOverrides,
    );

    return productState.productId;
};
