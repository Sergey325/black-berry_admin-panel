import {getProducts, IProductsParams} from "@/app/actions/getProducts";
import ProductsClient from "@/app/(dashboard)/products/ProductsClient";
import {getMaterials} from "@/app/actions/getMaterials";
import {getCategories} from "@/app/actions/getCategories";

export const dynamic = 'force-dynamic'

type Props = {
    searchParams: Promise<IProductsParams>;
};

const Products = async ({searchParams}: Props) => {
    const params = await searchParams;

    const [products, materials, categories] = await Promise.all([
        getProducts(params),
        getMaterials(),
        getCategories(),
    ])

    return (
        <ProductsClient products={products} materials={materials} categories={categories}/>
    );
};

export default Products;