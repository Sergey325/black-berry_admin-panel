import {ICategory} from "@/app/actions/getCategories";
import {useRouter} from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import ToolTip from "@/app/components/ToolTip";
import {MdEdit} from "react-icons/md";
import {FiTrash2} from "react-icons/fi";
import Link from "next/link";


type Props = {
    category: ICategory
    onEdit: (category: ICategory) => void
};

const CategoryRow = ({category, onEdit}: Props) => {
    const router = useRouter();

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
        <div className="flex items-center gap-3 border-b border-gray-200 px-3 py-3.5 transition last:border-b-0 hover:bg-gray-50/80 sm:grid sm:grid-cols-[100px_minmax(0,1fr)_120px_120px] sm:gap-4 sm:px-4">

            <div className="relative aspect-5/3 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                <Image
                    src={category.coverImage}
                    fill
                    alt={category.name}
                    className="object-contain object-right"
                />
            </div>

            <div className="flex-1 sm:contents min-w-0">
                <Link href={`${process.env.NEXT_PUBLIC_SHOP_URL}/catalog/${category.slug}`} className="wrap-break-word font-medium text-gray-900 hover:text-primary transition-colors">
                    {category.name}
                </Link>

                <p className="text-sm font-medium text-gray-600 sm:text-center">
                    {category._count.products}
                </p>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:justify-center">
                <ToolTip label="Редагувати">
                    <button type="button" onClick={() => onEdit(category)} className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-blue-50 hover:text-blue-600" aria-label="Редагувати категорію">
                        <MdEdit className="size-5"/>
                    </button>
                </ToolTip>

                <ToolTip label="Видалити">
                    <button type="button" onClick={handleDelete} className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600" aria-label="Видалити категорію">
                        <FiTrash2 className="size-5"/>
                    </button>
                </ToolTip>
            </div>

        </div>
    );
};

export default CategoryRow;
