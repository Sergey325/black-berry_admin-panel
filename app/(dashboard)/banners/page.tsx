import { getBanners, type IBannersParams } from "@/app/actions/getBanners";
import BannersClient from "@/app/(dashboard)/banners/BannersClient";

type Props = {
    searchParams: Promise<IBannersParams>;
};

const Banners = async ({ searchParams }: Props) => {
    const banners = await getBanners(await searchParams);

    return <BannersClient banners={banners} />;
};

export default Banners;
