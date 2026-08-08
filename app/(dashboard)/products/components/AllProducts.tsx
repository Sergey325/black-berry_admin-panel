import SearchInput from "@/app/components/SearchInput";
import {FiPlus} from "react-icons/fi";
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
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full items-center gap-3 lg:max-w-xl">
                    <SearchInput />
                    <button
                        type="button"
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-black px-3 text-sm font-medium text-white transition hover:bg-gray-800 sm:px-4"
                        onClick={() => handleChangeTab("AddProduct")}
                    >
                        <FiPlus className="size-5"/>
                        <span className="hidden sm:inline">Додати товар</span>
                    </button>
                </div>
                <div className="w-full lg:w-fit">
                    <Dropdown key={currentSort} options={SORT_OPTIONS} defaultValue={currentSort} buttonClassName="lg:min-w-[210px]"/>
                </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 md:px-5">
                    <div>
                        <h2 className="font-semibold text-gray-900">Асортимент</h2>
                        <p className="mt-0.5 text-xs text-gray-500">{products.length} товарів у вибірці</p>
                    </div>
                </div>
                <div className="hidden grid-cols-[60px_1fr_120px_100px] items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 sm:grid">
                    <span></span>
                    <span>Назва</span>
                    <span className="text-center">Ціна</span>
                    <span className="text-center">Дії</span>
                </div>

                {products.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                        <p className="font-medium text-gray-700">Товари не знайдено</p>
                        <p className="mt-1 text-sm text-gray-400">Змініть запит або додайте перший товар</p>
                    </div>
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
