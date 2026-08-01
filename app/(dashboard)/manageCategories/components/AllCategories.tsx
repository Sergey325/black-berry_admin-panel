import {ICategory} from "@/app/actions/getCategories";
import SearchInput from "@/app/(dashboard)/components/SearchInput";
import ToolTip from "@/app/components/ToolTip";
import {CiCirclePlus} from "react-icons/ci";
import CategoryRow from "@/app/(dashboard)/manageCategories/components/CategoryRow";

type Props = {
    categories: ICategory[];
    handleChangeTab: (tab: string) => void
    onEdit: (category: ICategory) => void
};

const AllCategories = ({categories, handleChangeTab, onEdit}: Props) => {
    return (
        <div className="flex flex-col gap-4 mt-10">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-center sm:justify-between">
                <div className="w-full flex gap-4 items-center">
                    <SearchInput />
                    <ToolTip label="Додати категорію">
                        <CiCirclePlus
                            className="size-8 text-gray-400 hover:text-gray-800 cursor-pointer transition bg-white rounded-full"
                            onClick={() => handleChangeTab("AddCategory")}
                        />
                    </ToolTip>
                </div>
                {/*<div className="w-full sm:w-fit">*/}
                {/*    <DropDown key={currentSort} options={SORT_OPTIONS} handleChange={handleSortChange} currentValue={currentSort}/>*/}
                {/*</div>*/}
            </div>
            <div className="border border-gray-300 bg-white rounded-md overflow-hidden">

                {/* Заголовок таблицы */}
                <div className="hidden sm:grid grid-cols-[100px_minmax(0,1fr)_120px_120px] items-center gap-4 px-4 py-3 border-b border-gray-300 bg-gray-50 text-sm lg:text-base font-medium text-gray-600">
                    <span></span>
                    <span>Назва</span>
                    <span className="text-center">К-сть товарів</span>
                    <span className="text-center">Дії</span>
                </div>

                {categories.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Категорій не знайдено</p>
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
