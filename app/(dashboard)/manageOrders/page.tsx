import ManageOrdersClient from "@/app/(dashboard)/manageOrders/components/ManageOrdersClient";
import {getOrders, IOrdersParams} from "@/app/actions/getOrders";

export const dynamic = 'force-dynamic'

type Props = {
    searchParams: Promise<IOrdersParams>;
};

const ManageOrders = async ({searchParams}: Props) => {
    const params = await searchParams;
    const orders = await getOrders(params);

    return (
        <ManageOrdersClient orders={orders}/>
    );
};

export default ManageOrders;