import ManageOrdersClient from "@/app/(dashboard)/manageOrders/components/ManageOrdersClient";
import {getOrders, IOrdersParams} from "@/app/actions/getOrders";
import {getProducts} from "@/app/actions/getProducts";

export const dynamic = 'force-dynamic'

type Props = {
    searchParams: Promise<IOrdersParams>;
};

const ManageOrders = async ({searchParams}: Props) => {
    const params = await searchParams;
    const orders = await getOrders(params);
    const products = await getProducts(params);


    return (
        <ManageOrdersClient orders={orders} products={products}/>
    );
};

export default ManageOrders;