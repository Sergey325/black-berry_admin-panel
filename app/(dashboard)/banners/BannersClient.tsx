"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import qs from "query-string";
import type { IBanner } from "@/app/actions/getBanners";
import AllBanners from "@/app/(dashboard)/banners/components/AllBanners";
import AddBanner from "@/app/(dashboard)/banners/components/AddBanner";
import DashboardPageHeader from "@/app/(dashboard)/components/DashboardPageHeader";

type Props = {
    banners: IBanner[];
};

const BannersClient = ({ banners }: Props) => {
    const [selectedBanner, setSelectedBanner] = useState<IBanner | null>(null);
    const params = useSearchParams();
    const router = useRouter();
    const tab = useMemo(() => params.get("tab") ?? "AllBanners", [params]);

    const handleChangeTab = useCallback((tabTitle: string) => {
        if (tabTitle === "AllBanners") {
            setSelectedBanner(null);
        }

        const url = qs.stringifyUrl({
            url: "/banners",
            query: { ...qs.parse(params.toString()), tab: tabTitle },
        }, { skipNull: true });

        router.push(url);
    }, [params, router]);

    const onEditBanner = (banner: IBanner) => {
        setSelectedBanner(banner);
        handleChangeTab("AddBanner");
    };

    return (
        <main className="py-6 md:py-10">
            <DashboardPageHeader
                title={tab === "AllBanners" ? "Банери" : selectedBanner ? "Редагування банера" : "Новий банер"}
                description={tab === "AllBanners"
                    ? "Керуйте промоблоками та порядком їх показу на сайті"
                    : selectedBanner ? "Оновіть вміст банера й перевірте результат у прев’ю" : "Створіть банер і одразу перегляньте його майбутній вигляд"}
            />
            <div className="mt-7">
            {tab === "AllBanners"
                ? <AllBanners banners={banners} onEdit={onEditBanner} handleChangeTab={handleChangeTab} />
                : <AddBanner banner={selectedBanner ?? undefined} resetSelectedBanner={() => setSelectedBanner(null)} />}
            </div>
        </main>
    );
};

export default BannersClient;
