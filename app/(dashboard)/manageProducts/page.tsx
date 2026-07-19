import {getProducts, IProductsParams} from "@/app/actions/getProducts";
import ManageProductsClient from "@/app/(dashboard)/manageProducts/ManageProductsClient";
import {getMaterials} from "@/app/actions/getMaterials";
import {getCategories} from "@/app/actions/getCategories";

export const dynamic = 'force-dynamic'

type Props = {
    searchParams: Promise<IProductsParams>;
};

const ManageProducts = async ({searchParams}: Props) => {
    const params = await searchParams;

    const [products, materials, categories] = await Promise.all([
        getProducts(params),
        getMaterials(),
        getCategories(),
    ])

    return (
        <ManageProductsClient products={products} materials={materials} categories={categories}/>
    );
};

export default ManageProducts;