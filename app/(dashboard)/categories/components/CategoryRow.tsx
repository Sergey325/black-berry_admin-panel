import {ICategory} from "@/app/actions/getCategories";
import {useRouter} from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import ToolTip from "@/app/components/ToolTip";
import {MdEdit} from "react-icons/md";
import {FiTrash2} from "react-icons/fi";


type Props = {
    category: ICategory
    onEdit: (category: ICategory) => void
};

const CategoryRow = ({category, onEdit}: Props) => {
    const router = useRouter();

    // const handleEdit = () => {
    //     router.push(`/?edit=${product.id}`);
    // };

    const handleDelete = async () => {
        if (!confirm(`Видалити товар "${category.name}"?`)) return;

        await axios.delete(`/api/category/${category.id}`)
            .then(() => {
                toast.success("Категорію успішно видалено!");
                router.refresh()
            })
            .catch((error) => {
                toast.error(error?.response?.data?.error)
            });
    };

    return (
        <div className="flex items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[100px_minmax(0,1fr)_120px_120px] sm:gap-4 sm:px-4 border-b border-gray-300 hover:bg-gray-50 transition">

            <div className="relative aspect-5/3  w-20 shrink-0">
                <Image
                    src={category.coverImage}
                    fill
                    alt={category.name}
                    className="object-scale-down object-top-right rounded-lg border border-gray-300"
                />
            </div>

            <div className="flex-1 sm:contents min-w-0">
                <p className="text-base font-medium wrap-break-word">
                    {category.name}
                </p>

                <p className="text-base sm:text-center font-medium">
                    {category._count.products}
                </p>
            </div>

            <div className="flex items-center gap-10 lg:gap-5 shrink-0 sm:justify-center">
                <ToolTip label="Редагувати">
                    <MdEdit
                        onClick={() => onEdit(category)}
                        className="size-7 text-gray-500 hover:text-blue-600 transition cursor-pointer"
                    />
                </ToolTip>

                <ToolTip label="Видалити">
                    <FiTrash2
                        onClick={handleDelete}
                        className="size-7 text-gray-500 hover:text-red-600 transition cursor-pointer"
                    />
                </ToolTip>
            </div>

        </div>
    );
};

export default CategoryRow;