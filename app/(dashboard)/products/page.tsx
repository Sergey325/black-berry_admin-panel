import {getProductById, getProductList, IProductsParams} from "@/app/actions/getProducts";
import ProductsClient from "@/app/(dashboard)/products/ProductsClient";
import {getProductFormReferences} from "@/app/actions/getProductFormReferences";

type Props = {
    searchParams: Promise<IProductsParams>;
};

const Products = async ({searchParams}: Props) => {
    const params = await searchParams;
    const isFormOpen = params.tab === "AddProduct";
    const productId = Number(params.productId);
    const hasProductId = Number.isInteger(productId) && productId > 0;

    const [products, product, references] = await Promise.all([
        getProductList(isFormOpen ? undefined : params),
        isFormOpen && hasProductId ? getProductById(productId) : null,
        isFormOpen ? getProductFormReferences() : null,
    ]);

    return (
        <ProductsClient
            products={products}
            product={product}
            references={references}
        />
    );
};

export default Products;
