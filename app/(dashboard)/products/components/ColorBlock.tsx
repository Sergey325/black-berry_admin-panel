import {
    Control,
    Controller,
    FieldErrors,
    useFieldArray,
    UseFormRegister,
} from "react-hook-form";
import ToolTip from "@/app/components/ToolTip";
import ImagesUpload from "@/app/(dashboard)/products/components/ImagesUpload";
import {FormValuesProduct} from "@/app/types";
import CheckBox from "@/app/components/CheckBox";
import {FiTrash2} from "react-icons/fi";

type Props = {
    control: Control<FormValuesProduct>
    register: UseFormRegister<FormValuesProduct>
    colorIndex: number
    onRemoveColor: (colorIndex: number) => void
    errors: FieldErrors<FormValuesProduct>
};

const DEFAULT_SIZES = ["S", "M", "L", "XL"];

const ColorBlock = ({control, register, colorIndex, onRemoveColor, errors}: Props) => {
    const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
        control,
        name: `colors.${colorIndex}.sizes`,
    });

    return (
        <div className="flex min-w-0 flex-col gap-6 rounded-xl border border-gray-200 bg-gray-50/60 p-4 md:p-5">
            <div className="flex items-center gap-3 sm:gap-6">
                <Controller
                    control={control}
                    name={`colors.${colorIndex}.color`}
                    render={({ field }) => (
                        <input type="color" {...field} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    )}
                />
                <span className="text-base font-semibold text-gray-900">Варіант кольору</span>
                <ToolTip label="Видалити колір">
                    <button type="button" onClick={() => onRemoveColor(colorIndex)} className="inline-flex size-11 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600" aria-label="Видалити колір">
                        <FiTrash2 className="size-6"/>
                    </button>
                </ToolTip>
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
                        <ImagesUpload value={field.value} onChange={field.onChange} />
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
                                className="w-full rounded-lg border border-gray-200 px-2 py-1 uppercase outline-none transition focus:border-gray-400 sm:w-24"
                            />


                            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                                <label className="text-sm font-medium text-gray-700">Кількість</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    {...register(`colors.${colorIndex}.sizes.${sizeIndex}.quantity`, {
                                        min: 0,
                                        setValueAs: (value: string) => value === "" ? null : Number(value),
                                    })}
                                    className="w-24 shrink-0 rounded-lg border border-gray-200 px-2 py-1 outline-none transition focus:border-gray-400"
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
                    {DEFAULT_SIZES.map((size) => (
                        <button
                            key={size}
                            type="button"
                            onClick={() => appendSize({ size, available: true, quantity: null })}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-base transition hover:border-gray-400 hover:bg-gray-100"
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ColorBlock;
