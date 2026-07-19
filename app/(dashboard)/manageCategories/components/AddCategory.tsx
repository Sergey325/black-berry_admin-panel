import {ICategory} from "@/app/actions/getCategories";

type Props = {
    category?: ICategory;
    resetSelectedCategory: () => void;
}

const AddCategory = ({ category, resetSelectedCategory}: Props) => {

    return (
        <div>

        </div>
    );
};

export default AddCategory;