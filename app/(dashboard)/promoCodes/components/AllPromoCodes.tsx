import {FiPlus} from "react-icons/fi";
import type {PromoCodeListItem} from "@/app/actions/getPromoCodes";
import SearchInput from "@/app/components/SearchInput";
import PromoCodeRow from "@/app/(dashboard)/promoCodes/components/PromoCodeRow";

interface Props {
    promoCodes: PromoCodeListItem[];
    loadingEditId?: number;
    onAdd: () => void;
    onEdit: (id: number) => void;
    onDeleted: (id: number) => void;
    onStatusChanged: (id: number, isActive: boolean) => void;
}

const AllPromoCodes = ({promoCodes, loadingEditId, onAdd, onEdit, onDeleted, onStatusChanged}: Props) => (
    <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 lg:max-w-xl">
            <SearchInput placeholder="Пошук за кодом..."/>
            <button type="button" onClick={onAdd} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-black px-3 text-sm font-medium text-white transition hover:bg-gray-800 sm:px-4">
                <FiPlus className="size-5"/>
                <span className="hidden sm:inline">Додати промокод</span>
            </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-4 md:px-5">
                <h2 className="font-semibold text-gray-900">Усі промокоди</h2>
                <p className="mt-0.5 text-sm text-gray-600">{promoCodes.length} промокодів у вибірці</p>
            </div>
            <div className="hidden grid-cols-[minmax(110px,1fr)_70px_110px_minmax(200px,1.7fr)_100px_100px_150px_90px] items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 xl:grid">
                <span>Код</span>
                <span className="text-center">Знижка</span>
                <span className="text-center">Область дії</span>
                <span className="text-center">Період дії</span>
                <span className="text-center">Використання</span>
                <span className="text-center">Статус</span>
                <span className="text-center">Створено</span>
                <span className="text-center">Дії</span>
            </div>
            {promoCodes.length === 0
                ? <div className="px-4 py-12 text-center"><p className="font-medium text-gray-700">Промокодів не знайдено</p><p className="mt-1 text-sm text-gray-500">Змініть запит або додайте перший промокод</p></div>
                : promoCodes.map((promoCode) => (
                    <PromoCodeRow
                        key={promoCode.id}
                        promoCode={promoCode}
                        isLoadingEdit={loadingEditId === promoCode.id}
                        onEdit={onEdit}
                        onDeleted={onDeleted}
                        onStatusChanged={onStatusChanged}
                    />
                ))}
        </div>
    </div>
);

export default AllPromoCodes;
