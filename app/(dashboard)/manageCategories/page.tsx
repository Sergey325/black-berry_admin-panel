import {getCategories, ICategoriesParams} from "@/app/actions/getCategories";
import ManageCategoriesClient from "@/app/(dashboard)/manageCategories/ManageCategoriesClient";

// export const dynamic = 'force-dynamic'

type Props = {
    searchParams: Promise<ICategoriesParams>;
};

const ManageCategories = async ({searchParams}: Props) => {
    const params = await searchParams;

    const categories = await getCategories(params);

    return (
        <ManageCategoriesClient categories={categories}/>
    )
};

export default ManageCategories;