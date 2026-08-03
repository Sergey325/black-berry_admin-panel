"use client";

import {useCallback, useMemo, useState} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {useRouter, useSearchParams} from "next/navigation";
import qs from "query-string";
import type {PromoCodeListItem, PromoSelectOption} from "@/app/actions/getPromoCodes";
import AllPromoCodes from "@/app/(dashboard)/promoCodes/components/AllPromoCodes";
import PromoCodeForm from "@/app/(dashboard)/promoCodes/components/PromoCodeForm";
import {PromoCodeDetails} from "@/app/types";

interface Props {
    promoCodes: PromoCodeListItem[];
    categories: PromoSelectOption[];
    products: PromoSelectOption[];
}

const PromoCodesClient = ({promoCodes, categories, products}: Props) => {
    const [deletedIds, setDeletedIds] = useState<number[]>([]);
    const [statusChanges, setStatusChanges] = useState<Record<number, boolean>>({});
    const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCodeDetails>();
    const [loadingEditId, setLoadingEditId] = useState<number>();
    const params = useSearchParams();
    const router = useRouter();
    const tab = useMemo(() => params.get("tab") ?? "AllPromoCodes", [params]);
    const items = useMemo(() => promoCodes
        .filter((promoCode) => !deletedIds.includes(promoCode.id))
        .map((promoCode) => statusChanges[promoCode.id] === undefined
            ? promoCode
            : {...promoCode, isActive: statusChanges[promoCode.id]}), [deletedIds, promoCodes, statusChanges]);

    const handleChangeTab = useCallback((tabTitle: string) => {
        if (tabTitle === "AllPromoCodes") {
            setSelectedPromoCode(undefined);
            setStatusChanges({});
        }

        const url = qs.stringifyUrl({
            url: "/promoCodes",
            query: {...qs.parse(params.toString()), tab: tabTitle},
        }, {skipNull: true});
        router.push(url);
    }, [params, router]);

    const handleEdit = async (id: number) => {
        setLoadingEditId(id);
        try {
            const {data} = await axios.get<PromoCodeDetails>(`/api/promo-codes/${id}`);
            setSelectedPromoCode(data);
            handleChangeTab("EditPromoCode");
        } catch (error: unknown) {
            const message = axios.isAxiosError<{error?: string}>(error)
                ? error.response?.data?.error
                : undefined;
            toast.error(message ?? "Не вдалося завантажити промокод");
        } finally {
            setLoadingEditId(undefined);
        }
    };

    return (
        <div className="mt-10">
            {tab === "AllPromoCodes"
                ? (
                    <AllPromoCodes
                        promoCodes={items}
                        loadingEditId={loadingEditId}
                        onAdd={() => handleChangeTab("AddPromoCode")}
                        onEdit={handleEdit}
                        onDeleted={(id) => setDeletedIds((current) => [...current, id])}
                        onStatusChanged={(id, isActive) => setStatusChanges((current) => ({...current, [id]: isActive}))}
                    />
                )
                : (
                    <PromoCodeForm
                        promoCode={selectedPromoCode}
                        categories={categories}
                        products={products}
                        onBack={() => handleChangeTab("AllPromoCodes")}
                    />
                )}
        </div>
    );
};

export default PromoCodesClient;
