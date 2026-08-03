import OrdersClient from "@/app/(dashboard)/orders/OrdersClient";
import {getOrders, IOrdersParams} from "@/app/actions/getOrders";
import {getProducts} from "@/app/actions/getProducts";

export const dynamic = 'force-dynamic'

type Props = {
    searchParams: Promise<IOrdersParams>;
};

const Orders = async ({searchParams}: Props) => {
    const params = await searchParams;
    const orders = await getOrders(params);
    const products = await getProducts(params);


    return (
        <OrdersClient orders={orders} products={products}/>
    );
};

export default Orders;