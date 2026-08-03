import {CiCirclePlus} from "react-icons/ci";
import type {PromoCodeListItem} from "@/app/actions/getPromoCodes";
import SearchInput from "@/app/components/SearchInput";
import ToolTip from "@/app/components/ToolTip";
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
    <div className="mt-10 flex flex-col gap-4">
        <div className="flex items-center gap-4">
            <SearchInput placeholder="Пошук за кодом..."/>
            <ToolTip label="Додати промокод">
                <CiCirclePlus
                    onClick={onAdd}
                    className="size-8 cursor-pointer rounded-full bg-white text-gray-400 transition hover:text-gray-800"
                />
            </ToolTip>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
            <div className="hidden grid-cols-[minmax(110px,1fr)_70px_110px_minmax(200px,1.7fr)_100px_100px_150px_90px] items-center gap-3 border-b border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 xl:grid">
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
                ? <p className="py-8 text-center text-gray-400">Промокодів не знайдено</p>
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
