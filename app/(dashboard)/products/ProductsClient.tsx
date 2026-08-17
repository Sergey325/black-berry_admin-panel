"use client";

import {useCallback, useMemo, useState} from "react";
import { IProduct } from "@/app/actions/getProducts";
import {useRouter, useSearchParams} from "next/navigation";
import qs from "query-string";
import AllProducts from "@/app/(dashboard)/products/components/AllProducts";
import AddProduct from "@/app/(dashboard)/products/components/AddProduct";
import {IMaterial} from "@/app/actions/getMaterials";
import {ICategory} from "@/app/actions/getCategories";
import DashboardPageHeader from "@/app/(dashboard)/components/DashboardPageHeader";
import type {ICatalogColor} from "@/app/actions/getCatalogColors";

type Props = {
    products: IProduct[];
    materials: IMaterial[];
    categories: ICategory[];
    catalogColors: ICatalogColor[];
};

export default function ProductsClient({products, materials, categories, catalogColors}: Props) {
    const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
    const params = useSearchParams()
    const router = useRouter()

    const tab = useMemo(() => {
        return params?.get("tab") || "AllProducts";
    }, [params])

    const handleChangeTab = useCallback((tabTitle: string) => {
        if (tabTitle === "AllProducts") {
            setSelectedProduct(null)
        }

        if (tab === tabTitle) return null

        let currentQuery = {}

        if(params){
            currentQuery = qs.parse(params.toString())
        }

        const updatedQuery = {
            ...currentQuery,
            tab: tabTitle
        }

        const url = qs.stringifyUrl({
            url: '/products/',
            query: updatedQuery
        }, {skipNull: true})

        router.push(url)
    }, [params, router, tab])

    const onEditProduct = (product: IProduct) => {
        setSelectedProduct(product)
        handleChangeTab("AddProduct")
    }

    return (
        <main className="py-6 md:py-10">
            <DashboardPageHeader
                title={tab === "AllProducts" ? "Товари" : selectedProduct ? "Редагування товару" : "Новий товар"}
                description={tab === "AllProducts"
                    ? "Керуйте асортиментом, цінами, кольорами та наявністю"
                    : selectedProduct ? `Оновіть дані товару «${selectedProduct.name}»` : "Заповніть інформацію, додайте варіанти й зображення"}
            />
            <div className="mt-7">
            {
                tab === "AllProducts"
                    ? <AllProducts
                        products={products}
                        onEdit={onEditProduct}
                        handleChangeTab={handleChangeTab}
                    />
                    : <AddProduct
                        product={selectedProduct || undefined}
                        products={products}
                        materials={materials}
                        categories={categories}
                        catalogColors={catalogColors}
                        resetSelectedProduct={() => setSelectedProduct(null)}
                    />
            }
            </div>
        </main>
    );
}
