import SearchInput from "@/app/(dashboard)/components/SearchInput";
import ToolTip from "@/app/components/ToolTip";
import {CiCirclePlus} from "react-icons/ci";
import SortDropdown from "@/app/(dashboard)/components/SortDropDown";
import ProductRow from "@/app/(dashboard)/manageProducts/components/ProductRow";
import {useState} from "react";
import {IProduct} from "@/app/actions/getProducts";


type Props = {
    products: IProduct[]
    handleChangeTab: (tab: string) => void
    onEdit: (product: IProduct) => void
};

const AllProducts = ({products, handleChangeTab, onEdit}: Props) => {

    return (
        <div className="flex flex-col gap-4 mt-10">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-center sm:justify-between">
                <div className="w-full flex gap-4 items-center">
                    <SearchInput />
                    <ToolTip label="Додати продукт">
                        <CiCirclePlus
                            className="size-8 text-gray-400 hover:text-gray-800 cursor-pointer transition bg-white rounded-full"
                            onClick={() => handleChangeTab("AddProduct")}
                        />
                    </ToolTip>
                </div>
                <div className="w-full sm:w-fit">
                    <SortDropdown />
                </div>
            </div>
            <div className="border border-gray-300 bg-white rounded-md overflow-hidden">

                {/* Заголовок таблицы */}
                <div className="hidden sm:grid grid-cols-[60px_1fr_120px_100px] items-center gap-4 px-4 py-3 border-b border-gray-300 bg-gray-50 text-sm lg:text-base font-medium text-gray-600">
                    <span></span>
                    <span>Назва</span>
                    <span className="text-center">Ціна</span>
                    <span className="text-center">Дії</span>
                </div>

                {products.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Товари не знайдено</p>
                ) : (
                    products.map((product) => (
                        <ProductRow key={product.id} product={product} onEdit={onEdit}/>
                    ))
                )}

            </div>
        </div>
    );
};

export default AllProducts;