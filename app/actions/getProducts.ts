"use server";

import prisma from "@/app/lib/prisma";
import {Prisma} from "@prisma/client";

const productListSelect = {
    id: true,
    name: true,
    slug: true,
    price: true,
    discount: true,
    category: {
        select: {
            id: true,
            name: true,
            slug: true,
        },
    },
    colors: {
        take: 1,
        orderBy: [{position: "asc"}, {id: "asc"}],
        select: {
            images: {
                take: 1,
                orderBy: {order: "asc"},
                select: {
                    url: true,
                },
            },
        },
    },
} satisfies Prisma.ProductSelect;

const productDetailsSelect = {
    id: true,
    name: true,
    price: true,
    discount: true,
    description: true,
    categoryId: true,
    materialId: true,
    hasLining: true,
    colors: {
        orderBy: [{position: "asc"}, {id: "asc"}],
        select: {
            id: true,
            color: true,
            colorName: true,
            colorCode: true,
            isBestSeller: true,
            images: {
                orderBy: {order: "asc"},
                select: {
                    url: true,
                    order: true,
                },
            },
            sizes: {
                select: {
                    id: true,
                    size: true,
                    available: true,
                    quantity: true,
                },
            },
            ProductColorFilter: {
                include: {
                    CatalogColor: true,
                },
            },
        },
    },
    ProductSpecificationOverride: {
        select: {
            categorySpecificationId: true,
            value: true,
        },
    },
    relatedTo: {
        orderBy: {order: "asc"},
        select: {
            toProduct: {
                select: {
                    id: true,
                    name: true,
                    colors: {
                        take: 1,
                        orderBy: [{position: "asc"}, {id: "asc"}],
                        select: {
                            images: {
                                take: 1,
                                orderBy: {order: "asc"},
                                select: {
                                    url: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.ProductSelect;

const orderProductSelect = {
    id: true,
    name: true,
    price: true,
    colors: {
        orderBy: [{position: "asc"}, {id: "asc"}],
        select: {
            id: true,
            color: true,
            colorName: true,
            colorCode: true,
            images: {
                take: 1,
                orderBy: {order: "asc"},
                select: {
                    url: true,
                },
            },
            sizes: {
                select: {
                    id: true,
                    size: true,
                },
            },
        },
    },
} satisfies Prisma.ProductSelect;

type ProductDetailsQueryResult = Prisma.ProductGetPayload<{select: typeof productDetailsSelect}>;

export type IProductListItem = Prisma.ProductGetPayload<{select: typeof productListSelect}>;
export type IProductColor = ProductDetailsQueryResult["colors"][number];
export type IRelatedProduct = ProductDetailsQueryResult["relatedTo"][number]["toProduct"];
export type IOrderProduct = Prisma.ProductGetPayload<{select: typeof orderProductSelect}>;
export type IProduct = Omit<ProductDetailsQueryResult, "relatedTo" | "ProductSpecificationOverride"> & {
    relatedTo: IRelatedProduct[];
    specificationOverrides: ProductDetailsQueryResult["ProductSpecificationOverride"];
};

export interface IProductsParams {
    title?: string;
    sort?: string;
    tab?: string;
    productId?: string;
}

const getProductOrderBy = (
    sort?: string,
): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] => (
    sort === "name_asc" ? {name: "asc"} :
        sort === "name_desc" ? {name: "desc"} :
            sort === "oldest" ? {createdAt: "asc"} :
                sort === "newest" ? {createdAt: "desc"} :
                    [{position: "asc"}, {id: "asc"}]
);

export async function getProductList(params?: IProductsParams): Promise<IProductListItem[]> {
    try {
        const {title, sort} = params ?? {};
        const products = await prisma.product.findMany({
            where: title ? {name: {contains: title, mode: "insensitive"}} : undefined,
            select: productListSelect,
            orderBy: getProductOrderBy(sort),
        });

        if (sort === "price_asc") {
            products.sort(
                (first, second) =>
                    first.price * (1 - first.discount / 100) -
                    second.price * (1 - second.discount / 100),
            );
        }

        if (sort === "price_desc") {
            products.sort(
                (first, second) =>
                    second.price * (1 - second.discount / 100) -
                    first.price * (1 - first.discount / 100),
            );
        }

        return products;
    } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to get product list");
    }
}

export async function getProductById(productId: number): Promise<IProduct | null> {
    try {
        const product = await prisma.product.findUnique({
            where: {id: productId},
            select: productDetailsSelect,
        });

        if (!product) return null;

        const {relatedTo, ProductSpecificationOverride, ...details} = product;

        return {
            ...details,
            relatedTo: relatedTo.map(({toProduct}) => toProduct),
            specificationOverrides: ProductSpecificationOverride,
        };
    } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to get product");
    }
}

export async function getOrderProducts(): Promise<IOrderProduct[]> {
    try {
        return await prisma.product.findMany({
            select: orderProductSelect,
            orderBy: [{name: "asc"}, {id: "asc"}],
        });
    } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to get order products");
    }
}
