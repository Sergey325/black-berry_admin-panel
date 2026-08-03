import {getPromoCodeOptions, getPromoCodes, type PromoCodesParams} from "@/app/actions/getPromoCodes";
import PromoCodesClient from "@/app/(dashboard)/promoCodes/PromoCodesClient";

export const dynamic = "force-dynamic";

type Props = {
    searchParams: Promise<PromoCodesParams>;
};

const PromoCodesPage = async ({searchParams}: Props) => {
    const [promoCodes, options] = await Promise.all([
        getPromoCodes(await searchParams),
        getPromoCodeOptions(),
    ]);

    return (
        <PromoCodesClient
            promoCodes={promoCodes}
            categories={options.categories}
            products={options.products}
        />
    );
};

export default PromoCodesPage;
