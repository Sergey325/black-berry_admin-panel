import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { MdEdit } from "react-icons/md";
import { IProduct } from "@/app/actions/getProducts";
import ToolTip from "@/app/components/ToolTip";
import {calculatePriceWithDiscount} from "@/app/utils/calculateDiscount";
import {FiTrash2} from "react-icons/fi";
import Link from "next/link";

type Props = {
    product: IProduct;
    onEdit: (product: IProduct) => void;
};

export default function ProductRow({ product, onEdit }: Props) {
    const router = useRouter();

    const firstImage = product.colors[0]?.images[0]?.url;

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
        <div className="flex items-center gap-3 border-b border-gray-200 px-3 py-3.5 transition last:border-b-0 hover:bg-gray-50/80 sm:grid sm:grid-cols-[60px_1fr_120px_100px] sm:gap-4 sm:px-4">

            <Image
                src={firstImage}
                width={50}
                height={50}
                alt={product.name}
                className="aspect-square size-[50px] shrink-0 rounded-lg border border-gray-200 object-cover"
            />

            <div className="flex-1 sm:contents min-w-0">
                <Link
                    href={`${process.env.NEXT_PUBLIC_SHOP_URL}/catalog/${product.category?.slug}/${product.id}-${product.slug}`}
                    className="wrap-break-word font-medium text-gray-900 hover:text-primary transition-colors">{product.name}
                </Link>
                <p className="mt-0.5 text-sm text-gray-500 sm:hidden">{calculatePriceWithDiscount(product.price, product.discount)} грн</p>
                <p className="hidden text-center text-sm font-medium text-gray-900 sm:block">{calculatePriceWithDiscount(product.price, product.discount)} грн</p>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:justify-center">
                <ToolTip label="Редагувати">
                    <button type="button" onClick={() => onEdit(product)} className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-blue-50 hover:text-blue-600" aria-label="Редагувати товар">
                        <MdEdit className="size-5"/>
                    </button>
                </ToolTip>
                <ToolTip label="Видалити">
                    <button type="button" onClick={handleDelete} className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600" aria-label="Видалити товар">
                        <FiTrash2 className="size-5"/>
                    </button>
                </ToolTip>
            </div>

        </div>
    );
}
