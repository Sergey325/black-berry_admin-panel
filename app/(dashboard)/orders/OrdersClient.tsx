"use client";

import {useCallback, useMemo} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {IOrder} from "@/app/actions/getOrders";
import AddOrder from "@/app/(dashboard)/orders/components/AddOrder";
import AllOrders from "@/app/(dashboard)/orders/components/AllOrders";
import {IOrderProduct} from "@/app/actions/getProducts";
import DashboardPageHeader from "@/app/(dashboard)/components/DashboardPageHeader";

type Props = {
    orders: IOrder[];
    order: IOrder | null;
    products: IOrderProduct[];
};

export default function OrdersClient({orders, order, products}: Props) {
    const params = useSearchParams()
    const router = useRouter()

    const tab = useMemo(() => {
        return params?.get("tab") || "AllOrders";
    }, [params])

    const navigateToForm = useCallback((orderId?: number) => {
        const nextParams = new URLSearchParams(params.toString());
        nextParams.set("tab", "AddOrder");

        if (orderId) {
            nextParams.set("orderId", String(orderId));
        } else {
            nextParams.delete("orderId");
        }

        router.push(`/orders?${nextParams.toString()}`);
    }, [params, router]);


    return (
        <main className="py-6 md:py-10">
            <DashboardPageHeader
                title={tab === "AllOrders" ? "Замовлення" : order ? "Редагування замовлення" : "Нове замовлення"}
                description={tab === "AllOrders"
                    ? "Відстежуйте замовлення, оплату та виконання"
                    : order ? `Оновіть дані замовлення ${order.invoiceId || order.id}` : "Створіть замовлення вручну для клієнта"}
            />
            <div className="mt-7">
            {
                tab === "AllOrders"
                    ? <AllOrders orders={orders} onAdd={() => navigateToForm()} onEdit={(selectedOrder) => navigateToForm(selectedOrder.id)}/>
                    : <AddOrder key={order?.id ?? "new"} products={products} order={order || undefined}/>
            }
            </div>
        </main>
    );
}
