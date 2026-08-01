import { CiCirclePlus } from "react-icons/ci";
import type { IBanner } from "@/app/actions/getBanners";
import SearchInput from "@/app/(dashboard)/components/SearchInput";
import ToolTip from "@/app/components/ToolTip";
import BannerRow from "@/app/(dashboard)/manageBanners/components/BannerRow";

type Props = {
    banners: IBanner[];
    handleChangeTab: (tab: string) => void;
    onEdit: (banner: IBanner) => void;
};

const AllBanners = ({ banners, handleChangeTab, onEdit }: Props) => (
    <div className="mt-10 flex flex-col gap-4">
        <div className="flex items-center gap-4">
            <SearchInput />
            <ToolTip label="Додати банер">
                <CiCirclePlus className="size-8 cursor-pointer rounded-full bg-white text-gray-400 transition hover:text-gray-800" onClick={() => handleChangeTab("AddBanner")} />
            </ToolTip>
        </div>
        <div className="overflow-hidden rounded-md border border-gray-300 bg-white">
            <div className="hidden grid-cols-[140px_minmax(0,1fr)_100px_120px] items-center gap-4 border-b border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 sm:grid lg:text-base">
                <span>Зображення</span>
                <span>Заголовок</span>
                <span className="text-center">Порядок</span>
                <span className="text-center">Дії</span>
            </div>
            {banners.length === 0
                ? <p className="py-8 text-center text-gray-400">Банерів не знайдено</p>
                : banners.map((banner) => <BannerRow key={banner.id} banner={banner} onEdit={onEdit} />)}
        </div>
    </div>
);

export default AllBanners;
