import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { MdEdit, MdDelete } from "react-icons/md";
import { IProduct } from "@/app/actions/getProducts";
import ToolTip from "@/app/components/ToolTip";
import {calculatePriceWithDiscount} from "@/app/utils/calculateDiscount";

type Props = {
    product: IProduct;
    onEdit: (product: IProduct) => void;
};

export default function ProductRow({ product, onEdit }: Props) {
    const router = useRouter();

    const firstImage = product.colors[0]?.images[0]?.url;

    // const handleEdit = () => {
    //     router.push(`/?edit=${product.id}`);
    // };

    const handleDelete = async () => {
        if (!confirm(`Видалити товар "${product.name}"?`)) return;

        await axios.delete(`/api/product/${product.id}`)
            .then(() => {
                toast.success("Product deleted successfully!");
                router.refresh()
            })
            .catch((error) => {
                toast.error(error?.response?.data?.error)
            });
    };

    return (
        <div className="flex items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[60px_1fr_120px_100px] sm:gap-4 sm:px-4 border-b border-gray-300 hover:bg-gray-50 transition">

            <Image
                src={firstImage}
                width={50}
                height={50}
                alt={product.name}
                className="object-cover aspect-square rounded-md border border-gray-200 shrink-0"
            />

            <div className="flex-1 sm:contents min-w-0">
                <p className="text-sm lg:text-base font-medium wrap-break-word">{product.name}</p>
                <p className="text-sm  sm:hidden mt-0.5">{calculatePriceWithDiscount(product.price, product.discount)} грн</p>
                <p className="hidden sm:block text-sm lg:text-base text-center">{calculatePriceWithDiscount(product.price, product.discount)} грн</p>
            </div>

            <div className="flex items-center gap-5 shrink-0 sm:justify-center">
                <ToolTip label="Редагувати">
                    <MdEdit
                        onClick={() => onEdit(product)}
                        className="size-6 md:size-7 text-gray-500 hover:text-blue-600 transition cursor-pointer"
                    />
                </ToolTip>
                <ToolTip label="Видалити">
                    <MdDelete
                        onClick={handleDelete}
                        className="size-6 md:size-7 text-gray-500 hover:text-red-600 transition cursor-pointer"
                    />
                </ToolTip>
            </div>

        </div>
    );
}