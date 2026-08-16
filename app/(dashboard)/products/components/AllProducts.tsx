import SearchInput from "@/app/components/SearchInput";
import {FiPlus} from "react-icons/fi";
import ProductRow from "@/app/(dashboard)/products/components/ProductRow";
import {IProduct} from "@/app/actions/getProducts";
import {useRouter, useSearchParams} from "next/navigation";
import Dropdown from "@/app/components/DropDown";
import {CSSProperties, useId, useMemo, useState} from "react";
import {FiChevronDown} from "react-icons/fi";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {MdDragIndicator} from "react-icons/md";
import {reorderProducts} from "@/app/actions/reorderProducts";
import toast from "react-hot-toast";


type Props = {
    products: IProduct[]
    handleChangeTab: (tab: string) => void
    onEdit: (product: IProduct) => void
};

type ProductGroup = {
    categoryId: number | null;
    categoryName: string;
    products: IProduct[];
};

type ProductCategoryProps = {
    group: ProductGroup;
    onEdit: (product: IProduct) => void;
    canReorder: boolean;
};

type SortableProductProps = {
    product: IProduct;
    onEdit: (product: IProduct) => void;
    disabled: boolean;
};

const SortableProduct = ({product, onEdit, disabled}: SortableProductProps) => {
    const {
        attributes,
        listeners,
        setActivatorNodeRef,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: product.id, disabled});
    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        position: "relative",
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.65 : 1,
    };

    const dragHandle = disabled ? null : (
        <button
            ref={setActivatorNodeRef}
            type="button"
            className="inline-flex size-9 touch-none cursor-grab items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing"
            aria-label={`Змінити позицію товару ${product.name}`}
            {...attributes}
            {...listeners}
        >
            <MdDragIndicator className="size-5"/>
        </button>
    );

    return (
        <div ref={setNodeRef} style={style} className="border-b border-gray-200 last:border-b-0">
            <ProductRow product={product} onEdit={onEdit} dragHandle={dragHandle}/>
        </div>
    );
};

const ProductCategory = ({group, onEdit, canReorder}: ProductCategoryProps) => {
    const [isOpen, setIsOpen] = useState(true);
    const [orderedProducts, setOrderedProducts] = useState(group.products);
    const [isSaving, setIsSaving] = useState(false);
    const contentId = useId();
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 6}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    );

    const handleDragEnd = async ({active, over}: DragEndEvent) => {
        if (!canReorder || isSaving || !over || active.id === over.id || group.categoryId === null) return;

        const previousProducts = orderedProducts;
        const oldIndex = previousProducts.findIndex(({id}) => id === active.id);
        const newIndex = previousProducts.findIndex(({id}) => id === over.id);

        if (oldIndex < 0 || newIndex < 0) return;

        const nextProducts = arrayMove(previousProducts, oldIndex, newIndex);
        setOrderedProducts(nextProducts);
        setIsSaving(true);

        try {
            await reorderProducts(group.categoryId, nextProducts.map(({id}) => id));
            toast.success("Порядок товарів збережено");
        } catch {
            setOrderedProducts(previousProducts);
            toast.error("Не вдалося зберегти порядок товарів");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section data-category-id={group.categoryId ?? "uncategorized"} className="border-b border-gray-200 last:border-b-0">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                aria-expanded={isOpen}
                aria-controls={contentId}
                className="flex w-full cursor-pointer items-center justify-between gap-4 bg-gray-50/70 px-4 py-3 text-left transition hover:bg-gray-100 md:px-5"
            >
                <span className="min-w-0">
                    <span className="block truncate font-semibold text-gray-900">{group.categoryName}</span>
                    <span className="text-xs text-gray-500">
                        {group.products.length} товарів{isSaving ? " · збереження..." : ""}
                    </span>
                </span>
                <FiChevronDown className={`size-5 shrink-0 text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}/>
            </button>

            <div className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div id={contentId} inert={!isOpen} className="overflow-hidden">
                    <div className="hidden grid-cols-[36px_60px_1fr_120px_100px] items-center gap-4 border-y border-gray-200 bg-white px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-gray-500 sm:grid">
                        <span></span>
                        <span></span>
                        <span>Назва</span>
                        <span className="text-center">Ціна</span>
                        <span className="text-center">Дії</span>
                    </div>
                    <DndContext
                        id={`products-category-${group.categoryId ?? "uncategorized"}`}
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={orderedProducts.map(({id}) => id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div data-category-products>
                                {orderedProducts.map((product) => (
                                    <SortableProduct
                                        key={product.id}
                                        product={product}
                                        onEdit={onEdit}
                                        disabled={!canReorder || isSaving}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
        </section>
    );
};

const AllProducts = ({products, handleChangeTab, onEdit}: Props) => {
    const router = useRouter();
    const params = useSearchParams();

    const currentSort = params.get("sort") ?? "position";
    const hasSearch = Boolean(params.get("title")?.trim());
    const canReorder = currentSort === "position" && !hasSearch;

    const productGroups = useMemo<ProductGroup[]>(() => {
        const groups = new Map<string, ProductGroup>();

        products.forEach((product) => {
            const key = product.category ? String(product.category.id) : "uncategorized";
            const existingGroup = groups.get(key);

            if (existingGroup) {
                existingGroup.products.push(product);
                return;
            }

            groups.set(key, {
                categoryId: product.category?.id ?? null,
                categoryName: product.category?.name ?? "Без категорії",
                products: [product],
            });
        });

        return Array.from(groups.values()).sort((firstGroup, secondGroup) => {
            if (firstGroup.categoryId === null) return 1;
            if (secondGroup.categoryId === null) return -1;
            return firstGroup.categoryName.localeCompare(secondGroup.categoryName, "uk");
        });
    }, [products]);

    const SORT_OPTIONS = [
        { value: "position", label: "Порядок у категорії", onClick: function() {handleSortChange(this.value)}},
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
                        {!canReorder && products.length > 0 && (
                            <p className="mt-1 text-xs text-amber-600">
                                Для зміни порядку виберіть «Порядок у категорії» та очистьте пошук
                            </p>
                        )}
                    </div>
                </div>
                {products.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                        <p className="font-medium text-gray-700">Товари не знайдено</p>
                        <p className="mt-1 text-sm text-gray-400">Змініть запит або додайте перший товар</p>
                    </div>
                ) : (
                    productGroups.map((group) => (
                        <ProductCategory
                            key={`${group.categoryId ?? "uncategorized"}:${group.products.map(({id}) => id).join("-")}`}
                            group={group}
                            onEdit={onEdit}
                            canReorder={canReorder && group.categoryId !== null && group.products.length > 1}
                        />
                    ))
                )}

            </div>
        </div>
    );
};

export default AllProducts;
