import { getBanners, type IBannersParams } from "@/app/actions/getBanners";
import ManageBannersClient from "@/app/(dashboard)/manageBanners/ManageBannersClient";

type Props = {
    searchParams: Promise<IBannersParams>;
};

const ManageBanners = async ({ searchParams }: Props) => {
    const banners = await getBanners(await searchParams);

    return <ManageBannersClient banners={banners} />;
};

export default ManageBanners;
