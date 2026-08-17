import {getProducts, IProductsParams} from "@/app/actions/getProducts";
import ProductsClient from "@/app/(dashboard)/products/ProductsClient";
import {getMaterials} from "@/app/actions/getMaterials";
import {getCategories} from "@/app/actions/getCategories";
import {getCatalogColors} from "@/app/actions/getCatalogColors";

export const dynamic = 'force-dynamic'

type Props = {
    searchParams: Promise<IProductsParams>;
};

const Products = async ({searchParams}: Props) => {
    const params = await searchParams;

    const [products, materials, categories, catalogColors] = await Promise.all([
        getProducts(params),
        getMaterials(),
        getCategories(),
        getCatalogColors(),
    ])

    return (
        <ProductsClient products={products} materials={materials} categories={categories} catalogColors={catalogColors}/>
    );
};

export default Products;
