import {ICategory} from "@/app/actions/getCategories";
import SearchInput from "@/app/components/SearchInput";
import {FiPlus} from "react-icons/fi";
import CategoryRow from "@/app/(dashboard)/categories/components/CategoryRow";

type Props = {
    categories: ICategory[];
    handleChangeTab: (tab: string) => void
    onEdit: (category: ICategory) => void
};

const AllCategories = ({categories, handleChangeTab, onEdit}: Props) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 lg:max-w-xl">
                    <SearchInput />
                    <button
                        type="button"
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-black px-3 text-sm font-medium text-white transition hover:bg-gray-800 sm:px-4"
                        onClick={() => handleChangeTab("AddCategory")}
                    >
                        <FiPlus className="size-5"/>
                        <span className="hidden sm:inline">Додати категорію</span>
                    </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-4 py-4 md:px-5">
                    <h2 className="font-semibold text-gray-900">Структура каталогу</h2>
                    <p className="mt-0.5 text-xs text-gray-500">{categories.length} категорій у вибірці</p>
                </div>
                <div className="hidden grid-cols-[100px_minmax(0,1fr)_120px_120px] items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 sm:grid">
                    <span></span>
                    <span>Назва</span>
                    <span className="text-center">К-сть товарів</span>
                    <span className="text-center">Дії</span>
                </div>

                {categories.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                        <p className="font-medium text-gray-700">Категорій не знайдено</p>
                        <p className="mt-1 text-sm text-gray-400">Змініть запит або додайте першу категорію</p>
                    </div>
                ) : (
                    categories.map((category) => (
                        <CategoryRow key={category.id} category={category} onEdit={onEdit}/>
                    ))
                )}

            </div>
        </div>
    );
};

export default AllCategories;
