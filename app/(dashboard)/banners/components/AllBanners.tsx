import { FiPlus } from "react-icons/fi";
import type { IBanner } from "@/app/actions/getBanners";
import SearchInput from "@/app/components/SearchInput";
import BannerRow from "@/app/(dashboard)/banners/components/BannerRow";

type Props = {
    banners: IBanner[];
    handleChangeTab: (tab: string) => void;
    onEdit: (banner: IBanner) => void;
};

const AllBanners = ({ banners, handleChangeTab, onEdit }: Props) => (
    <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 lg:max-w-xl">
            <SearchInput />
            <button type="button" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-black px-3 text-sm font-medium text-white transition hover:bg-gray-800 sm:px-4" onClick={() => handleChangeTab("AddBanner")}>
                <FiPlus className="size-5"/>
                <span className="hidden sm:inline">Додати банер</span>
            </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-4 md:px-5">
                <h2 className="font-semibold text-gray-900">Банери на сайті</h2>
                <p className="mt-0.5 text-xs text-gray-500">{banners.length} банерів у вибірці</p>
            </div>
            <div className="hidden grid-cols-[140px_minmax(0,1fr)_100px_120px] items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 sm:grid">
                <span>Зображення</span>
                <span>Заголовок</span>
                <span className="text-center">Порядок</span>
                <span className="text-center">Дії</span>
            </div>
            {banners.length === 0
                ? <div className="px-4 py-12 text-center"><p className="font-medium text-gray-700">Банерів не знайдено</p><p className="mt-1 text-sm text-gray-400">Змініть запит або додайте перший банер</p></div>
                : banners.map((banner) => <BannerRow key={banner.id} banner={banner} onEdit={onEdit} />)}
        </div>
    </div>
);

export default AllBanners;
