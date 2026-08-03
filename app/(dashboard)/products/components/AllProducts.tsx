import SearchInput from "@/app/components/SearchInput";
import ToolTip from "@/app/components/ToolTip";
import {CiCirclePlus} from "react-icons/ci";
// import DropDown from "@/app/(dashboard)/components/DropDown";
import ProductRow from "@/app/(dashboard)/products/components/ProductRow";
import {IProduct} from "@/app/actions/getProducts";
import {useRouter, useSearchParams} from "next/navigation";
import Dropdown from "@/app/components/DropDown";


type Props = {
    products: IProduct[]
    handleChangeTab: (tab: string) => void
    onEdit: (product: IProduct) => void
};

const AllProducts = ({products, handleChangeTab, onEdit}: Props) => {
    const router = useRouter();
    const params = useSearchParams();

    const currentSort = params.get("sort") ?? "newest";

    const SORT_OPTIONS = [
        { value: "newest", label: "Спочатку нові", onClick: function() {handleSortChange(this.value)}},
        { value: "oldest", label: "Спочатку старі", onClick: function() {handleSortChange(this.value)}},
        { value: "price_asc", label: "Ціна: за зростанням", onClick: function() {handleSortChange(this.value)}},
        { value: "price_desc", label: "Ціна: за спаданням", onClick: function() {handleSortChange(this.value)}},
        { value: "name_asc", label: "Назва: А-Я", onClick: function() {handleSortChange(this.value)}},
        { value: "name_desc", label: "Назва: Я-А", onClick: function() {handleSortChange(this.value)}},
    ];

    const handleSortChange = (value: string) => {
        const qs = new URLSearchParams(params);
        qs.set("sort", value);
        router.push(`?${qs.toString()}`);
    };

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
                    <Dropdown key={currentSort} options={SORT_OPTIONS} defaultValue={currentSort} buttonClassName={"min-w-[190px] text-right"}/>
                </div>
            </div>
            <div className="border border-gray-300 bg-white rounded-xl overflow-hidden">

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