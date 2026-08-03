"use client";

import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { MdEdit } from "react-icons/md";
import type { IBanner } from "@/app/actions/getBanners";
import ToolTip from "@/app/components/ToolTip";
import {FiTrash2} from "react-icons/fi";

type Props = {
    banner: IBanner;
    onEdit: (banner: IBanner) => void;
};

const BannerRow = ({ banner, onEdit }: Props) => {
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm(`Видалити банер «${banner.title.replace(/\n/g, " ")}»?`)) return;

        try {
            await axios.delete(`/api/banner/${banner.id}`);
            toast.success("Банер успішно видалено!");
            router.refresh();
        } catch (error: unknown) {
            const message = axios.isAxiosError<{ error?: string }>(error)
                ? error.response?.data?.error
                : undefined;
            toast.error(message ?? "Не вдалося видалити банер");
        }
    };

    return (
        <div className="flex items-center gap-3 border-b border-gray-300 px-3 py-3 transition hover:bg-gray-50 sm:grid sm:grid-cols-[140px_minmax(0,1fr)_100px_120px] sm:gap-4 sm:px-4">
            <div className="relative aspect-5/3 w-28 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                <Image src={banner.image} alt={""} fill sizes="112px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1 sm:contents">
                <p className="line-clamp-2 text-base font-medium">{banner.title}</p>
                <p className="text-center text-base font-medium">{banner.order}</p>
            </div>
            <div className="flex shrink-0 items-center gap-5 sm:justify-center">
                <ToolTip label="Редагувати"><MdEdit className="size-7 cursor-pointer text-gray-500 transition hover:text-blue-600" onClick={() => onEdit(banner)} /></ToolTip>
                <ToolTip label="Видалити"><FiTrash2 className="size-7 cursor-pointer text-gray-500 transition hover:text-red-600" onClick={handleDelete} /></ToolTip>
            </div>
        </div>
    );
};

export default BannerRow;
