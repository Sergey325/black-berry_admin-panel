import {getCategories} from "@/app/actions/getCategories";
import ManageCategoriesClient from "@/app/(dashboard)/manageCategories/ManageCategoriesClient";

// export const dynamic = 'force-dynamic'

const ManageCategories = async () => {
    const categories = await getCategories();

    return (
        <ManageCategoriesClient categories={categories}/>
    )
};

export default ManageCategories;