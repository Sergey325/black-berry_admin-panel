"use server";

import prisma from "@/app/lib/prisma";
import { ICategory } from "@/app/actions/getCategories";

export interface IProductSize {
    id: number;
    size: string;
    available: boolean;
    productColorId: number;
}

export interface IProductImage {
    id: number;
    url: string;
    order: number;
    productColorId: number;
}

export interface IProductColor {
    id: number;
    color: string;
    colorName: string;
    colorCode: string | null;
    productId: number;
    isBestSeller: boolean;
    images: IProductImage[];
    sizes: IProductSize[];
}

export interface IProductMaterial {
    id: number;
    name: string;
}

export interface IRelatedProductCategory {
    id: number;
    name: string;
    slug: string;
}

export interface IRelatedProduct {
    id: number;
    name: string;
    slug: string;
    price: number;
    discount: number;
    material: IProductMaterial | null;
    category: IRelatedProductCategory | null;
    colors: {
        id: number;
        color: string;
        colorName: string;
        colorCode: string | null;
        productId: number;
        isBestSeller: boolean;
        images: IProductImage[];
        sizes: IProductSize[];
    }[];
}

export interface IProduct {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    discount: number;
    quantity: number | null;
    material: IProductMaterial | null;
    createdAt: Date;
    updatedAt: Date;
    colors: IProductColor[];
    category: ICategory | null;
    relatedTo: IRelatedProduct[];
}

export interface IProductsParams {
    title?: string;
    sort?: string;
}

export async function getProducts(params?: IProductsParams): Promise<IProduct[]> {
    try {
        const { title, sort } = params ?? {};

        const orderBy: any =
            sort === "name_asc" ? { name: "asc" } :
                sort === "name_desc" ? { name: "desc" } :
                    sort === "oldest" ? { createdAt: "asc" } :
                        { createdAt: "desc" }; // newest по умолчанию

        const products = await prisma.product.findMany({
            where: title ? { name: { contains: title, mode: "insensitive" } } : undefined,
            include: {
                colors: {
                    include: {
                        images: true,
                        sizes: true,
                    },
                },
                material: true,
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
                    orderBy: { order: "asc" },
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
                                    include: {
                                        images: {
                                            take: 1,
                                            orderBy: { order: "asc" },
                                        },
                                        sizes: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
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

        const result: IProduct[] = products.map(({ relatedTo, ...rest }) => ({
            ...rest,
            relatedTo: relatedTo.map((r) => r.toProduct),
        }));

        return result;
    } catch (error: any) {
        throw new Error(error);
    }
}