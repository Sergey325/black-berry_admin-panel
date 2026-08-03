import {getCategories, ICategoriesParams} from "@/app/actions/getCategories";
import CategoriesClient from "@/app/(dashboard)/categories/CategoriesClient";

// export const dynamic = 'force-dynamic'

type Props = {
    searchParams: Promise<ICategoriesParams>;
};

const Categories = async ({searchParams}: Props) => {
    const params = await searchParams;

    const categories = await getCategories(params);

    return (
        <CategoriesClient categories={categories}/>
    )
};

export default Categories;