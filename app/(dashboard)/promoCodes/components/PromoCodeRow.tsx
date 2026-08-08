"use client";

import {useState} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {useRouter} from "next/navigation";
import {FiTrash2} from "react-icons/fi";
import {MdEdit} from "react-icons/md";
import type {PromoCodeListItem, PromoScope} from "@/app/actions/getPromoCodes";
import ToolTip from "@/app/components/ToolTip";
import {formatDateAndTime} from "@/app/utils/formatDate";

interface Props {
    promoCode: PromoCodeListItem;
    isLoadingEdit: boolean;
    onEdit: (id: number) => void;
    onDeleted: (id: number) => void;
    onStatusChanged: (id: number, isActive: boolean) => void;
}

const scopeLabels: Record<PromoScope, string> = {
    ALL: "Весь каталог",
    CATEGORY: "Категорії",
    PRODUCT: "Товари",
};

const getPeriod = (startsAt: Date | null, expiresAt: Date | null) => {
    if (!startsAt && !expiresAt) return "Без обмежень";
    if (!startsAt) return `Одразу — ${formatDateAndTime(expiresAt as Date)}`;
    if (!expiresAt) return `${formatDateAndTime(startsAt)} — без обмежень`;
    return `${formatDateAndTime(startsAt)} — ${formatDateAndTime(expiresAt)}`;
};

const getErrorMessage = (error: unknown, fallback: string) => axios.isAxiosError<{error?: string}>(error)
    ? error.response?.data?.error ?? fallback
    : fallback;

const PromoCodeRow = ({promoCode, isLoadingEdit, onEdit, onDeleted, onStatusChanged}: Props) => {
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const toggleStatus = async () => {
        setIsUpdatingStatus(true);
        try {
            const isActive = !promoCode.isActive;
            await axios.patch(`/api/promo-codes/${promoCode.id}`, {isActive});
            onStatusChanged(promoCode.id, isActive);
            toast.success(isActive ? "Промокод активовано" : "Промокод деактивовано");
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Не вдалося змінити статус"));
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Видалити промокод «${promoCode.code}»?`)) return;

        setIsDeleting(true);
        try {
            await axios.delete(`/api/promo-codes/${promoCode.id}`);
            onDeleted(promoCode.id);
            toast.success("Промокод успішно видалено!");
            router.refresh();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Не вдалося видалити промокод"));
            setIsDeleting(false);
        }
    };

    const renderStatusButton = () => (
        <button
            type="button"
            onClick={toggleStatus}
            disabled={isUpdatingStatus}
            className={`w-fit xl:mx-auto rounded-full px-2 py-1 text-xs font-medium transition disabled:opacity-50 ${promoCode.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
        >
            {promoCode.isActive ? "Активний" : "Неактивний"}
        </button>
    );

    const renderActions = () => (
        <div className="flex shrink-0 items-center gap-1 sm:justify-center">
            <ToolTip label="Редагувати">
                <button type="button" disabled={isLoadingEdit} onClick={() => onEdit(promoCode.id)} className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40" aria-label="Редагувати промокод">
                    <MdEdit className="size-5"/>
                </button>
            </ToolTip>
            <ToolTip label="Видалити">
                <button type="button" disabled={isDeleting} onClick={handleDelete} className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40" aria-label="Видалити промокод">
                    <FiTrash2 className="size-5"/>
                </button>
            </ToolTip>
        </div>
    );

    return (
        <div className="border-b border-gray-200 transition last:border-b-0 hover:bg-gray-50">
            <div className="px-4 py-4 text-sm xl:hidden">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <span className="block text-xs font-medium text-gray-400">Код</span>
                        <span className="mt-1 block break-all text-base font-semibold tracking-wide">{promoCode.code}</span>
                    </div>
                    <div className="shrink-0">{renderActions()}</div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700">
                        −{promoCode.discountPercent}%
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {scopeLabels[promoCode.scopeType]}
                    </span>
                    {renderStatusButton()}
                </div>

                <div className="mt-4 grid gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2 md:grid-cols-[minmax(0,2fr)_minmax(100px,0.7fr)_minmax(160px,1fr)]">
                    <div className="min-w-0 sm:col-span-2 md:col-span-1">
                        <span className="block text-xs font-medium text-gray-400">Період дії</span>
                        <span className="mt-1 block leading-5">{getPeriod(promoCode.startsAt, promoCode.expiresAt)}</span>
                    </div>
                    <div className="min-w-0">
                        <span className="block text-xs font-medium text-gray-400">Використання</span>
                        <span className="mt-1 block">{promoCode.maxUses === null ? promoCode.usedCount : `${promoCode.usedCount} / ${promoCode.maxUses}`}</span>
                    </div>
                    <div className="min-w-0">
                        <span className="block text-xs font-medium text-gray-400">Створено</span>
                        <span className="mt-1 block leading-5">{formatDateAndTime(promoCode.createdAt)}</span>
                    </div>
                </div>
            </div>

            <div className="hidden grid-cols-[minmax(110px,1fr)_70px_110px_minmax(200px,1.7fr)_100px_100px_150px_90px] items-center gap-3 px-4 py-3 text-sm xl:grid">
                <span className="break-all font-semibold tracking-wide">{promoCode.code}</span>
                <span className="text-center">{promoCode.discountPercent}%</span>
                <span className="xl:mx-auto">
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {scopeLabels[promoCode.scopeType]}
                    </span>
                </span>
                <span className="leading-5 xl:text-center">{getPeriod(promoCode.startsAt, promoCode.expiresAt)}</span>
                <span className=" xl:text-center">{promoCode.maxUses === null ? promoCode.usedCount : `${promoCode.usedCount} / ${promoCode.maxUses}`}</span>
                {renderStatusButton()}
                <span className="leading-5 xl:text-center">{formatDateAndTime(promoCode.createdAt)}</span>
                <div className="flex justify-center">{renderActions()}</div>
            </div>
        </div>
    );
};

export default PromoCodeRow;
