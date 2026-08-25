"use server";

import prisma from "@/app/lib/prisma";
import {Prisma} from "@prisma/client";

const productInclude = {
    colors: {
        orderBy: [{position: "asc"}, {id: "asc"}],
        include: {
            images: {
                orderBy: {order: "asc"},
            },
            sizes: true,
            ProductColorFilter: {
                include: {
                    CatalogColor: true,
                },
            },
        },
    },
    material: true,
    ProductSpecificationOverride: true,
    category: {
        include: {
            specifications: true,
            _count: {
                select: {
                    products: true,
                },
            },
        },
    },
    relatedTo: {
        orderBy: {order: "asc"},
        include: {
            toProduct: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    discount: true,
                    material: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    colors: {
                        orderBy: [{position: "asc"}, {id: "asc"}],
                        include: {
                            images: {
                                take: 1,
                                orderBy: {order: "asc"},
                            },
                            sizes: true,
                            ProductColorFilter: {
                                include: {
                                    CatalogColor: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.ProductInclude;

type ProductQueryResult = Prisma.ProductGetPayload<{include: typeof productInclude}>;

export type IProductColor = ProductQueryResult["colors"][number];
export type IRelatedProduct = ProductQueryResult["relatedTo"][number]["toProduct"];
export type IProduct = Omit<ProductQueryResult, "relatedTo" | "ProductSpecificationOverride"> & {
    relatedTo: IRelatedProduct[];
    specificationOverrides: ProductQueryResult["ProductSpecificationOverride"];
};

export interface IProductsParams {
    title?: string;
    sort?: string;
}

export async function getProducts(params?: IProductsParams): Promise<IProduct[]> {
    try {
        const { title, sort } = params ?? {};

        const orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] =
            sort === "name_asc" ? { name: "asc" } :
                sort === "name_desc" ? { name: "desc" } :
                    sort === "oldest" ? { createdAt: "asc" } :
                        sort === "newest" ? { createdAt: "desc" } :
                            [{position: "asc"}, {id: "asc"}];

        const products = await prisma.product.findMany({
            where: title ? { name: { contains: title, mode: "insensitive" } } : undefined,
            include: productInclude,
            orderBy,
        });

        if (sort === "price_asc") {
            products.sort(
                (a, b) =>
                    a.price * (1 - a.discount / 100) -
                    b.price * (1 - b.discount / 100)
            );
        }

        if (sort === "price_desc") {
            products.sort(
                (a, b) =>
                    b.price * (1 - b.discount / 100) -
                    a.price * (1 - a.discount / 100)
            );
        }

        const result: IProduct[] = products.map(({ relatedTo, ProductSpecificationOverride, ...rest }) => ({
            ...rest,
            relatedTo: relatedTo.map((r) => r.toProduct),
            specificationOverrides: ProductSpecificationOverride,
        }));

        return result;
    } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to get products");
    }
}
