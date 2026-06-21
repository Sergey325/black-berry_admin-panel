"use server";

import prisma from "@/app/lib/prisma";

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
    productId: number;
    images: IProductImage[];
    sizes: IProductSize[];
}

export interface IProduct {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    discount: number;
    createdAt: Date;
    updatedAt: Date;
    colors: IProductColor[];
}

export interface IProductsParams {
    title?: string;
    sort?: string;
}

export async function getProducts(params?: IProductsParams) {
    try {
        const { title, sort } = params ?? {};

        const orderBy: any =
            sort === "price_asc" ? { price: "asc" } :
                sort === "price_desc" ? { price: "desc" } :
                    sort === "name_asc" ? { name: "asc" } :
                        sort === "name_desc" ? { name: "desc" } :
                            sort === "oldest" ? { createdAt: "asc" } :
                                { createdAt: "desc" }; // newest по умолчанию

        const products = await prisma.product.findMany({
            where: title ? { name: { contains: title, mode: "insensitive" } } : undefined,
            include: {
                colors: { include: { images: true, sizes: true } },
            },
            orderBy,
        });
        return products;
    }
    catch (error: any) {
        throw new Error(error)
    }
}