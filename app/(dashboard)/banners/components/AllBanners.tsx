"use client";

import type {CSSProperties} from "react";
import {useState} from "react";
import {FiPlus} from "react-icons/fi";
import {MdDragIndicator} from "react-icons/md";
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
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
import {useSearchParams} from "next/navigation";
import toast from "react-hot-toast";
import type {IBanner} from "@/app/actions/getBanners";
import {reorderBanners} from "@/app/actions/reorderBanners";
import SearchInput from "@/app/components/SearchInput";
import BannerRow from "@/app/(dashboard)/banners/components/BannerRow";

type Props = {
    banners: IBanner[];
    handleChangeTab: (tab: string) => void;
    onEdit: (banner: IBanner) => void;
};

type SortableBannerProps = {
    banner: IBanner;
    onEdit: (banner: IBanner) => void;
    disabled: boolean;
};

const SortableBanner = ({banner, onEdit, disabled}: SortableBannerProps) => {
    const {
        attributes,
        listeners,
        setActivatorNodeRef,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: banner.id, disabled});
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
            aria-label={`Змінити позицію банера ${banner.title.replace(/\n/g, " ")}`}
            {...attributes}
            {...listeners}
        >
            <MdDragIndicator className="size-5"/>
        </button>
    );

    return (
        <div ref={setNodeRef} style={style} className="border-b border-gray-200 last:border-b-0">
            <BannerRow banner={banner} onEdit={onEdit} dragHandle={dragHandle}/>
        </div>
    );
};

const AllBanners = ({banners, handleChangeTab, onEdit}: Props) => {
    const params = useSearchParams();
    const [orderedBanners, setOrderedBanners] = useState(banners);
    const [isSaving, setIsSaving] = useState(false);
    const hasSearch = Boolean(params.get("title")?.trim());
    const canReorder = !hasSearch && orderedBanners.length > 1;
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 6}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    );

    const handleDragEnd = async ({active, over}: DragEndEvent) => {
        if (!canReorder || isSaving || !over || active.id === over.id) return;

        const previousBanners = orderedBanners;
        const oldIndex = previousBanners.findIndex(({id}) => id === active.id);
        const newIndex = previousBanners.findIndex(({id}) => id === over.id);

        if (oldIndex < 0 || newIndex < 0) return;

        const nextBanners = arrayMove(previousBanners, oldIndex, newIndex);
        setOrderedBanners(nextBanners);
        setIsSaving(true);

        try {
            await reorderBanners(nextBanners.map(({id}) => id));
            toast.success("Порядок банерів збережено");
        } catch {
            setOrderedBanners(previousBanners);
            toast.error("Не вдалося зберегти порядок банерів");
        } finally {
            setIsSaving(false);
        }
    };

    return (
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
                    <p className="mt-0.5 text-xs text-gray-500">
                        {banners.length} банерів у вибірці{isSaving ? " · збереження..." : ""}
                    </p>
                    {hasSearch && banners.length > 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                            Для зміни порядку очистьте пошук
                        </p>
                    )}
                </div>
                <div className="hidden grid-cols-[36px_140px_minmax(0,1fr)_120px] items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 sm:grid">
                    <span></span>
                    <span>Зображення</span>
                    <span>Заголовок</span>
                    <span className="text-center">Дії</span>
                </div>
                {orderedBanners.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                        <p className="font-medium text-gray-700">Банерів не знайдено</p>
                        <p className="mt-1 text-sm text-gray-400">Змініть запит або додайте перший банер</p>
                    </div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={orderedBanners.map(({id}) => id)} strategy={verticalListSortingStrategy}>
                            <div>
                                {orderedBanners.map((banner) => (
                                    <SortableBanner
                                        key={banner.id}
                                        banner={banner}
                                        onEdit={onEdit}
                                        disabled={!canReorder || isSaving}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
};

export default AllBanners;
