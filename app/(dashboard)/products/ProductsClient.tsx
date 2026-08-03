"use client";

import {useCallback, useMemo, useState} from "react";
import { IProduct } from "@/app/actions/getProducts";
import {useRouter, useSearchParams} from "next/navigation";
import qs from "query-string";
import AllProducts from "@/app/(dashboard)/products/components/AllProducts";
import AddProduct from "@/app/(dashboard)/products/components/AddProduct";
import {IMaterial} from "@/app/actions/getMaterials";
import {ICategory} from "@/app/actions/getCategories";

type Props = {
    products: IProduct[];
    materials: IMaterial[];
    categories: ICategory[];
};

export default function ProductsClient({products, materials, categories}: Props) {
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

        const updatedQuery: any = {
            ...currentQuery,
            tab: tabTitle
        }

        const url = qs.stringifyUrl({
            url: '/products/',
            query: updatedQuery
        }, {skipNull: true})

        router.push(url)
    }, [params])

    const onEditProduct = (product: IProduct) => {
        setSelectedProduct(product)
        handleChangeTab("AddProduct")
    }

    return (
        <div className="mt-10 ">
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
                        resetSelectedProduct={() => setSelectedProduct(null)}
                    />
            }
        </div>
    );
}