"use client";

import {useCallback, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import qs from "query-string";
import {IOrder} from "@/app/actions/getOrders";
import AddOrder from "@/app/(dashboard)/manageOrders/components/AddOrder";
import AllOrders from "@/app/(dashboard)/manageOrders/components/AllOrders";
import {IProduct} from "@/app/actions/getProducts";

type Props = {
    orders: IOrder[];
    products: IProduct[];
};

export default function ManageOrdersClient({orders, products}: Props) {
    const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
    const params = useSearchParams()
    const router = useRouter()

    const tab = useMemo(() => {
        return params?.get("tab") || "AllOrders";
    }, [params])

    const handleChangeTab = useCallback((tabTitle: string) => {
        if (tabTitle === "AllOrders") {
            setSelectedOrder(null)
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
            url: '/manageOrders/',
            query: updatedQuery
        }, {skipNull: true})

        router.push(url)
    }, [params])


    return (
        <div className="mt-10 ">
            {
                tab === "AllOrders" ? <AllOrders orders={orders} handleChangeTab={handleChangeTab}/> : <AddOrder products={products} />
            }
        </div>
    );
}