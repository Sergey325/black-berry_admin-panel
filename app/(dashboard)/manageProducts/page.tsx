import {getProducts, IProductsParams} from "@/app/actions/getProducts";
import ManageProductsClient from "@/app/(dashboard)/manageProducts/components/ManageProductsClient";


type Props = {
    searchParams: IProductsParams
}


const ManageProducts = async ({searchParams}: Props) => {
    const products = await getProducts(searchParams)

    return (
        <ManageProductsClient products={products}/>
    );
};

export default ManageProducts;