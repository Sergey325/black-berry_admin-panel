"use client"

import {CldUploadWidget, type CldUploadWidgetProps} from "next-cloudinary";
import Image from "next/image"
import {useCallback, useEffect, useRef} from "react";
import type {CSSProperties, ReactNode} from "react";
import toast from "react-hot-toast";
import {TbPhotoPlus} from "react-icons/tb";
import {IoMdClose} from "react-icons/io";
import axios from "axios";
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type {DragEndEvent} from "@dnd-kit/core";
import {
    arrayMove,
    rectSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {MdDragIndicator} from "react-icons/md";

type Props = {
    onChange: (value: Array<string>) => void
    value: Array<string>
    folder?: string
    maxFiles?: number
    multiple?: boolean
    uploadLabel?: string
    sortable?: boolean
};

type UploadWidgetOptions = NonNullable<CldUploadWidgetProps["options"]> & {
    asset_folder?: string
};

const getUploadedImageUrl = (result: unknown) => {
    const uploadResult = result as { info?: { secure_url?: unknown } };
    return typeof uploadResult.info?.secure_url === "string" ? uploadResult.info.secure_url : null;
};

type ImageCardProps = {
    image: string
    index: number
    onDelete: (imageUrl: string) => Promise<void>
    dragHandle?: ReactNode
};

const ImageCard = ({image, index, onDelete, dragHandle}: ImageCardProps) => (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
        <Image
            alt={`Завантажене зображення ${index + 1}`}
            height={100}
            width={100}
            className="size-20 object-cover md:size-25"
            src={image}
        />
        <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {index + 1}
        </span>
        {dragHandle}
        <button
            type="button"
            className="absolute right-0 top-0 inline-flex size-6 cursor-pointer items-center justify-center bg-gray-50 text-gray-950 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label={`Видалити зображення ${index + 1}`}
            onClick={() => void onDelete(image)}
        >
            <IoMdClose size={20}/>
        </button>
    </div>
);

type SortableImageProps = ImageCardProps;

const SortableImage = ({image, index, onDelete}: SortableImageProps) => {
    const {
        attributes,
        listeners,
        setActivatorNodeRef,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: image});
    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        position: "relative",
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.65 : 1,
    };
    const dragHandle = (
        <button
            ref={setActivatorNodeRef}
            type="button"
            className="absolute left-0 top-0 inline-flex size-6 touch-none cursor-grab items-center justify-center bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 active:cursor-grabbing"
            aria-label={`Змінити позицію зображення ${index + 1}`}
            {...attributes}
            {...listeners}
        >
            <MdDragIndicator size={20}/>
        </button>
    );

    return (
        <div ref={setNodeRef} style={style}>
            <ImageCard image={image} index={index} onDelete={onDelete} dragHandle={dragHandle}/>
        </div>
    );
};

type SortableImagesProps = {
    value: string[]
    onChange: (value: string[]) => void
    onDelete: (imageUrl: string) => Promise<void>
};

const SortableImages = ({value, onChange, onDelete}: SortableImagesProps) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 6}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    );

    const handleDragEnd = ({active, over}: DragEndEvent) => {
        if (!over || active.id === over.id) return;

        const oldIndex = value.indexOf(String(active.id));
        const newIndex = value.indexOf(String(over.id));

        if (oldIndex < 0 || newIndex < 0) return;
        onChange(arrayMove(value, oldIndex, newIndex));
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={value} strategy={rectSortingStrategy}>
                <div className="flex w-full flex-wrap gap-2 pt-4">
                    {value.map((image, index) => (
                        <SortableImage key={image} image={image} index={index} onDelete={onDelete}/>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

const ImagesUpload = ({
    onChange,
    value,
    folder = "BlackBerry",
    maxFiles = 10,
    multiple = true,
    uploadLabel = "Додати зображення",
    sortable = false,
}: Props) => {
    const valueRef = useRef(value);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    const handleUpload = useCallback((result: unknown) => {
        if (valueRef.current.length >= maxFiles) {
            toast.error(`Ви не можете завантажити більше ${maxFiles} зображень`)
            return
        }
        const imageUrl = getUploadedImageUrl(result);
        if (!imageUrl) {
            toast.error("Не вдалося отримати посилання на зображення");
            return;
        }
        const nextValue = [...valueRef.current, imageUrl];
        valueRef.current = nextValue;
        onChange(nextValue)
    }, [maxFiles, onChange])

    const handleDelete = useCallback(async (imageUrl: string) => {
        await axios.delete("/api/cloudinary", {
            data: {
                imageUrl,
            },
        })
            .then(() => {
                toast.success("Зображення видалено!");
            })
            .catch((error: unknown) => {
                if (axios.isAxiosError<{ error?: string }>(error)) {
                    toast.error(error.response?.data?.error ?? "Не вдалося видалити зображення");
                } else {
                    toast.error("Не вдалося видалити зображення");
                }
            })
            .finally(() => {
                const nextValue = valueRef.current.filter((i) => i !== imageUrl);
                valueRef.current = nextValue;
                onChange(nextValue)
            });
    }, [onChange])

    const handleReorder = useCallback((nextValue: string[]) => {
        valueRef.current = nextValue;
        onChange(nextValue);
    }, [onChange]);

    const widgetOptions: UploadWidgetOptions = {
        maxFiles,
        resourceType: "image",
        maxFileSize: 5500000,
        multiple,
        folder,
        asset_folder: folder,
    };

    return (
        <div>
            <CldUploadWidget
                onSuccess={handleUpload}
                signatureEndpoint="/api/cloudinary/sign"
                options={widgetOptions}
            >
                {({open}) => {
                    return (
                        <>
                            <div
                                onClick={() => open?.()}
                                className="
                                relative
                                cursor-pointer
                                bg-gray-50
                                hover:bg-gray-100
                                transition-colors
                                rounded-xl
                                border-dashed border border-gray-300
                                py-5 md:py-10
                                flex flex-col
                                justify-center items-center
                                gap-4
                                text-black
                            "
                            >
                                <TbPhotoPlus className="size-[25px] md:size-[50px]"/>
                                <div className="text-base font-medium">
                                    {uploadLabel}
                                </div>
                            </div>
                            {value.length > 0 && (
                                sortable ? (
                                    <>
                                        <SortableImages value={value} onChange={handleReorder} onDelete={handleDelete}/>
                                    </>
                                ) : (
                                    <div className="flex w-full flex-wrap gap-2 pt-4">
                                        {value.map((image, index) => (
                                            <ImageCard key={image} image={image} index={index} onDelete={handleDelete}/>
                                        ))}
                                    </div>
                                )
                            )}
                        </>
                    )
                }}
            </CldUploadWidget>
        </div>
    )
};

export default ImagesUpload;
