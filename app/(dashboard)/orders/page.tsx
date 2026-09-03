import OrdersClient from "@/app/(dashboard)/orders/OrdersClient";
import {getOrderById, getOrders, IOrdersParams} from "@/app/actions/getOrders";
import {getOrderProducts} from "@/app/actions/getProducts";

export const dynamic = 'force-dynamic'

type Props = {
    searchParams: Promise<IOrdersParams>;
};

const Orders = async ({searchParams}: Props) => {
    const params = await searchParams;
    const isFormOpen = params.tab === "AddOrder";
    const orderId = Number(params.orderId);
    const hasOrderId = Number.isInteger(orderId) && orderId > 0;
    const [orders, order, products] = await Promise.all([
        isFormOpen ? Promise.resolve([]) : getOrders(params),
        isFormOpen && hasOrderId ? getOrderById(orderId) : null,
        isFormOpen ? getOrderProducts() : Promise.resolve([]),
    ]);

    return (
        <OrdersClient orders={orders} order={order} products={products}/>
    );
};

export default Orders;
