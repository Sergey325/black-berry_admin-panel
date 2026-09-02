import OrdersClient from "@/app/(dashboard)/orders/OrdersClient";
import {getOrders, IOrdersParams} from "@/app/actions/getOrders";
import {getOrderProducts} from "@/app/actions/getProducts";

export const dynamic = 'force-dynamic'

type Props = {
    searchParams: Promise<IOrdersParams>;
};

const Orders = async ({searchParams}: Props) => {
    const params = await searchParams;
    const [orders, products] = await Promise.all([
        getOrders(params),
        params.tab === "AddOrder" ? getOrderProducts() : Promise.resolve([]),
    ]);

    return (
        <OrdersClient orders={orders} products={products}/>
    );
};

export default Orders;
