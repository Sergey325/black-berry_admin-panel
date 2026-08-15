"use client";

import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { MdEdit } from "react-icons/md";
import type { IBanner } from "@/app/actions/getBanners";
import ToolTip from "@/app/components/ToolTip";
import {FiTrash2} from "react-icons/fi";
import type {ReactNode} from "react";
import {showConfirmationToast} from "@/app/components/ConfirmationToast";

type Props = {
    banner: IBanner;
    onEdit: (banner: IBanner) => void;
    dragHandle?: ReactNode;
};

const BannerRow = ({ banner, onEdit, dragHandle }: Props) => {
    const router = useRouter();

    const handleDelete = () => {
        showConfirmationToast({
            toastId: `delete-banner-${banner.id}`,
            message: `Видалити банер «${banner.title.replace(/\n/g, " ")}»?`,
            onConfirmAction: async () => {
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
            },
        });
    };

    return (
        <div className="flex items-center gap-3 px-3 py-3.5 transition hover:bg-gray-50/80 sm:grid sm:grid-cols-[36px_140px_minmax(0,1fr)_120px] sm:gap-4 sm:px-4">
            <div className="flex size-9 shrink-0 items-center justify-center">
                {dragHandle}
            </div>
            <div className="relative aspect-5/3 w-28 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                <Image src={banner.image} alt={""} fill sizes="112px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1 sm:contents">
                <p className="line-clamp-2 font-medium text-gray-900">{banner.title}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:justify-center">
                <ToolTip label="Редагувати"><button type="button" onClick={() => onEdit(banner)} className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-blue-50 hover:text-blue-600" aria-label="Редагувати банер"><MdEdit className="size-5" /></button></ToolTip>
                <ToolTip label="Видалити"><button type="button" onClick={handleDelete} className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600" aria-label="Видалити банер"><FiTrash2 className="size-5" /></button></ToolTip>
            </div>
        </div>
    );
};

export default BannerRow;
