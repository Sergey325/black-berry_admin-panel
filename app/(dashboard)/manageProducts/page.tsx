import {getProducts, IProductsParams} from "@/app/actions/getProducts";
import ManageProductsClient from "@/app/(dashboard)/manageProducts/components/ManageProductsClient";

export const dynamic = 'force-dynamic'

type Props = {
    searchParams: Promise<IProductsParams>;
};

const ManageProducts = async ({searchParams}: Props) => {
    const params = await searchParams;
    const products = await getProducts(params);

    return (
        <ManageProductsClient products={products}/>
    );
};

export default ManageProducts;