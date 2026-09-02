"use client";

import {useCallback, useMemo} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import qs from "query-string";
import {IOrder} from "@/app/actions/getOrders";
import AddOrder from "@/app/(dashboard)/orders/components/AddOrder";
import AllOrders from "@/app/(dashboard)/orders/components/AllOrders";
import {IOrderProduct} from "@/app/actions/getProducts";
import DashboardPageHeader from "@/app/(dashboard)/components/DashboardPageHeader";

type Props = {
    orders: IOrder[];
    products: IOrderProduct[];
};

export default function OrdersClient({orders, products}: Props) {
    const params = useSearchParams()
    const router = useRouter()

    const tab = useMemo(() => {
        return params?.get("tab") || "AllOrders";
    }, [params])

    const handleChangeTab = useCallback((tabTitle: string) => {
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
            url: '/orders/',
            query: updatedQuery
        }, {skipNull: true})

        router.push(url)
    }, [params, router, tab])


    return (
        <main className="py-6 md:py-10">
            <DashboardPageHeader
                title={tab === "AllOrders" ? "Замовлення" : "Нове замовлення"}
                description={tab === "AllOrders"
                    ? "Відстежуйте замовлення, оплату та виконання"
                    : "Створіть замовлення вручну для клієнта"}
            />
            <div className="mt-7">
            {
                tab === "AllOrders" ? <AllOrders orders={orders} handleChangeTab={handleChangeTab}/> : <AddOrder products={products} />
            }
            </div>
        </main>
    );
}
