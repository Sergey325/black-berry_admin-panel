"use client";

import {useCallback} from "react";
import {IProduct, IProductListItem} from "@/app/actions/getProducts";
import {useRouter, useSearchParams} from "next/navigation";
import AllProducts from "@/app/(dashboard)/products/components/AllProducts";
import AddProduct from "@/app/(dashboard)/products/components/AddProduct";
import DashboardPageHeader from "@/app/(dashboard)/components/DashboardPageHeader";
import type {ProductFormReferences} from "@/app/actions/getProductFormReferences";

type Props = {
    products: IProductListItem[];
    product: IProduct | null;
    references: ProductFormReferences | null;
};

export default function ProductsClient({products, product, references}: Props) {
    const params = useSearchParams();
    const router = useRouter();
    const tab = params.get("tab") || "AllProducts";
    const isFormOpen = tab === "AddProduct";

    const navigateToForm = useCallback((productId?: number) => {
        const nextParams = new URLSearchParams(params.toString());
        nextParams.set("tab", "AddProduct");

        if (productId) {
            nextParams.set("productId", String(productId));
        } else {
            nextParams.delete("productId");
        }

        router.push(`/products?${nextParams.toString()}`);
    }, [params, router]);

    return (
        <main className="py-6 md:py-10">
            <DashboardPageHeader
                title={!isFormOpen ? "Товари" : product ? "Редагування товару" : "Новий товар"}
                description={!isFormOpen
                    ? "Керуйте асортиментом, цінами, кольорами та наявністю"
                    : product ? `Оновіть дані товару «${product.name}»` : "Заповніть інформацію, додайте варіанти й зображення"}
            />
            <div className="mt-7">
            {
                !isFormOpen
                    ? <AllProducts
                        products={products}
                        onEdit={(item) => navigateToForm(item.id)}
                        onAdd={() => navigateToForm()}
                    />
                    : references && <AddProduct
                        product={product || undefined}
                        products={products}
                        materials={references.materials}
                        categories={references.categories}
                        catalogColors={references.catalogColors}
                    />
            }
            </div>
        </main>
    );
}
