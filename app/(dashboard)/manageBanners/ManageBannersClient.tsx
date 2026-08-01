"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import qs from "query-string";
import type { IBanner } from "@/app/actions/getBanners";
import AllBanners from "@/app/(dashboard)/manageBanners/components/AllBanners";
import AddBanner from "@/app/(dashboard)/manageBanners/components/AddBanner";

type Props = {
    banners: IBanner[];
};

const ManageBannersClient = ({ banners }: Props) => {
    const [selectedBanner, setSelectedBanner] = useState<IBanner | null>(null);
    const params = useSearchParams();
    const router = useRouter();
    const tab = useMemo(() => params.get("tab") ?? "AllBanners", [params]);

    const handleChangeTab = useCallback((tabTitle: string) => {
        if (tabTitle === "AllBanners") {
            setSelectedBanner(null);
        }

        const url = qs.stringifyUrl({
            url: "/manageBanners",
            query: { ...qs.parse(params.toString()), tab: tabTitle },
        }, { skipNull: true });

        router.push(url);
    }, [params, router]);

    const onEditBanner = (banner: IBanner) => {
        setSelectedBanner(banner);
        handleChangeTab("AddBanner");
    };

    return (
        <div className="mt-10">
            {tab === "AllBanners"
                ? <AllBanners banners={banners} onEdit={onEditBanner} handleChangeTab={handleChangeTab} />
                : <AddBanner banner={selectedBanner ?? undefined} resetSelectedBanner={() => setSelectedBanner(null)} />}
        </div>
    );
};

export default ManageBannersClient;
