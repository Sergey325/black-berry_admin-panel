import {
    Control,
    Controller,
    FieldErrors,
    useFieldArray,
    useWatch,
    UseFormRegister,
} from "react-hook-form";
import ToolTip from "@/app/components/ToolTip";
import ImagesUpload from "@/app/components/ImagesUpload";
import {FormValuesProduct} from "@/app/types";
import CheckBox from "@/app/components/CheckBox";
import {FiTrash2} from "react-icons/fi";
import {FaChevronDown} from "react-icons/fa";
import {MdDragIndicator} from "react-icons/md";
import {useState} from "react";
import type {CSSProperties} from "react";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

type Props = {
    id: string
    control: Control<FormValuesProduct>
    register: UseFormRegister<FormValuesProduct>
    colorIndex: number
    onRemoveColor: (colorIndex: number) => void
    errors: FieldErrors<FormValuesProduct>
    defaultSizes: string[]
    initialOpen?: boolean
};

export const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"];

const ColorBlock = ({id, control, register, colorIndex, onRemoveColor, errors, defaultSizes, initialOpen = false}: Props) => {
    const [open, setOpen] = useState(initialOpen);
    const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
        control,
        name: `colors.${colorIndex}.sizes`,
    });
    const color = useWatch({control, name: `colors.${colorIndex}.color`});
    const colorName = useWatch({control, name: `colors.${colorIndex}.colorName`});
    const colorCode = useWatch({control, name: `colors.${colorIndex}.colorCode`});
    const images = useWatch({control, name: `colors.${colorIndex}.images`});
    const isBestSeller = useWatch({control, name: `colors.${colorIndex}.isBestSeller`});
    const colorErrors = errors.colors?.[colorIndex];
    const isOpen = open || Boolean(colorErrors);
    const {
        attributes,
        listeners,
        setActivatorNodeRef,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id});
    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        position: "relative",
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.65 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="min-w-0 rounded-xl border border-gray-200 bg-gray-50/60 shadow-sm">
            <div className="flex min-h-16 items-center gap-1 p-2 sm:gap-2">
                <button
                    ref={setActivatorNodeRef}
                    type="button"
                    className="inline-flex size-10 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-200 hover:text-gray-950 active:cursor-grabbing"
                    aria-label={`Змінити позицію кольору ${colorName || colorIndex + 1}`}
                    {...attributes}
                    {...listeners}
                >
                    <MdDragIndicator className="size-6"/>
                </button>
                <button
                    type="button"
                    onClick={() => setOpen((current) => !current)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-gray-100"
                    aria-expanded={isOpen}
                >
                    <span className="text-sm font-semibold text-gray-400">{colorIndex + 1}</span>
                    <span className="size-9 shrink-0 rounded-lg border border-gray-300" style={{backgroundColor: color}}/>
                    <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="truncate text-base font-semibold text-gray-900">
                                {colorName || "Новий колір"}
                            </span>
                            {colorCode && <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">Код {colorCode}</span>}
                            {isBestSeller && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">Хіт</span>}
                        </span>
                        <span className="block text-xs text-gray-500">
                            {images?.length ?? 0} фото · {sizeFields.length} розмірів
                        </span>
                    </span>
                    <FaChevronDown className={`size-4 shrink-0 text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}/>
                </button>
                <ToolTip label="Видалити колір">
                    <button type="button" onClick={() => onRemoveColor(colorIndex)} className="inline-flex size-11 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600" aria-label="Видалити колір">
                        <FiTrash2 className="size-6"/>
                    </button>
                </ToolTip>
            </div>

            <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                    <div className="flex min-w-0 flex-col gap-6 border-t border-gray-200 p-4 md:p-5">
                        <div className="flex items-center gap-3">
                            <Controller
                                control={control}
                                name={`colors.${colorIndex}.color`}
                                render={({ field }) => (
                                    <input type="color" {...field} className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200" />
                                )}
                            />
                            <span className="text-sm font-medium text-gray-700">Колір зразка</span>
                        </div>

            <div className="flex flex-col gap-1">

                <div className="flex flex-col md:flex-row md:items-end gap-6">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700">Назва кольору</label>
                        <input
                            {...register(`colors.${colorIndex}.colorName`, { required: "Обов'язкове поле" })}
                            className="max-w-[220px] rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                        />
                        {errors?.colors?.[colorIndex]?.colorName && <span className="text-sm text-red-500">{errors?.colors?.[colorIndex]?.colorName.message}</span>}
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700">Код кольору</label>
                        <input
                            {...register(`colors.${colorIndex}.colorCode`)}//, { required: "Обов'язкове поле" }
                            className="max-w-[220px] rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                        />
                        {errors?.colors?.[colorIndex]?.colorCode && <span className="text-sm text-red-500">{errors?.colors?.[colorIndex]?.colorCode.message}</span>}
                    </div>
                    <Controller
                        control={control}
                        name={`colors.${colorIndex}.isBestSeller`}
                        render={({field}) => (
                            <CheckBox
                                label="Хіт продажів"
                                checked={field.value}
                                onChange={field.onChange}
                                colorOnChecked="text-gray-950"
                                labelStyle="text-nowrap text-base"
                            />
                        )}
                    />
                </div>

            </div>
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Зображення для цього кольору</label>
                <Controller
                    control={control}
                    name={`colors.${colorIndex}.images`}
                    rules={{ validate: (value) => value.length > 0 || "Додайте хоча б одне зображення" }}
                    render={({ field }) => (
                        <ImagesUpload value={field.value} onChange={field.onChange} sortable />
                    )}
                />
                {errors?.colors?.[colorIndex]?.images && (
                    <span className="text-sm text-red-500">
                        {errors.colors[colorIndex].images.message as string}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Розміри</label>

                {sizeFields.map((sizeField, sizeIndex) => {
                    return (
                        <div key={sizeField.id} className="relative flex min-w-0 flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 pr-12 sm:flex-row sm:items-center sm:gap-8 sm:border-0 sm:bg-transparent sm:pr-3">
                            <input
                                {...register(`colors.${colorIndex}.sizes.${sizeIndex}.size`, { required: true })}
                                className="w-full rounded-lg border border-gray-200 px-2 py-1 outline-none transition focus:border-gray-400 sm:w-30"
                            />


                            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                                <label className="text-sm font-medium text-gray-700">Кількість</label>
                                <Controller
                                    control={control}
                                    name={`colors.${colorIndex}.sizes.${sizeIndex}.quantity`}
                                    rules={{min: 0}}
                                    render={({field}) => (
                                        <input
                                            ref={field.ref}
                                            name={field.name}
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={field.value ?? ""}
                                            onBlur={field.onBlur}
                                            onChange={(event) => field.onChange(
                                                event.target.value === "" ? null : Number(event.target.value)
                                            )}
                                            className="w-24 shrink-0 rounded-lg border border-gray-200 px-2 py-1 outline-none transition focus:border-gray-400"
                                        />
                                    )}
                                />
                            </div>
                            <Controller
                                control={control}
                                name={`colors.${colorIndex}.sizes.${sizeIndex}.available`}
                                render={({field}) => (
                                    <CheckBox
                                        label="В наявності"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        colorOnChecked="text-gray-950"
                                        labelStyle="text-nowrap text-base"
                                    />
                                )}
                            />
                            <ToolTip label="Видалити розмір">
                                <button type="button" onClick={() => removeSize(sizeIndex)} className="inline-flex size-10 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600" aria-label="Видалити розмір">
                                    <FiTrash2 className="size-6"/>
                                </button>
                            </ToolTip>
                        </div>
                    )
                } )}

                <div className="flex flex-wrap gap-2">
                    {defaultSizes.map((size) => (
                        <button
                            key={size}
                            type="button"
                            onClick={() => appendSize({ size, available: true, quantity: null })}
                            className="rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-base transition hover:border-gray-400 hover:bg-gray-100"
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColorBlock;
