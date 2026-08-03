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
        <div className="border border-gray-300 rounded-xl p-4 flex flex-col gap-8">

            {/* Цвет */}
            <div className="flex items-center gap-6">
                <Controller
                    control={control}
                    name={`colors.${colorIndex}.color`}
                    render={({ field }) => (
                        <input type="color" {...field} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    )}
                />
                <span className="text-base md:text-lg text-gray-500">Колір товару</span>
                <ToolTip label="Видалити колір">
                    <FiTrash2
                        className="size-7 md:size-8 text-red-400 hover:text-red-600 transition ml-auto cursor-pointer"
                        onClick={() => onRemoveColor(colorIndex)}
                    />
                </ToolTip>
            </div>

            <div className="flex flex-col gap-1">

                <div className="flex flex-col md:flex-row md:items-end gap-6">
                    <div className="flex flex-col">
                        <label className="text-base font-medium">Назва кольору</label>
                        <input
                            {...register(`colors.${colorIndex}.colorName`, { required: "Обов'язкове поле" })}
                            className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-600 transition md:text-lg max-w-[200px]"
                        />
                        {errors?.colors?.[colorIndex]?.colorName && <span className="text-red-500 text-base">{errors?.colors?.[colorIndex]?.colorName.message}</span>}
                    </div>
                    <div className="flex flex-col">
                        <label className="text-base font-medium">Код кольору</label>
                        <input
                            {...register(`colors.${colorIndex}.colorCode`)}//, { required: "Обов'язкове поле" }
                            className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-600 transition md:text-lg max-w-[200px]"
                        />
                        {errors?.colors?.[colorIndex]?.colorCode && <span className="text-red-500 text-base">{errors?.colors?.[colorIndex]?.colorCode.message}</span>}
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
                                labelStyle="text-nowrap sm:text-lg"
                            />
                        )}
                    />
                </div>

            </div>
            {/* Картинки для этого цвета */}
            <div className="flex flex-col gap-1">
                <label className="text-base md:text-lg font-medium">Зображення для цього кольору</label>
                <Controller
                    control={control}
                    name={`colors.${colorIndex}.images`}
                    rules={{ validate: (value) => value.length > 0 || "Додайте хоча б одне зображення" }}
                    render={({ field }) => (
                        <ImagesUpload value={field.value} onChange={field.onChange} />
                    )}
                />
                {errors?.colors?.[colorIndex]?.images && (
                    <span className="text-red-500 text-base md:text-lg">
                        {errors.colors[colorIndex].images.message as string}
                    </span>
                )}
            </div>

            {/* Размеры для этого цвета */}
            <div className="flex flex-col gap-2">
                <label className="text-base md:text-lg font-medium">Розміри</label>

                {sizeFields.map((sizeField, sizeIndex) => {
                    return (
                        <div key={sizeField.id} className="flex items-center gap-6 rounded-lg px-3 py-2">
                            <input
                                {...register(`colors.${colorIndex}.sizes.${sizeIndex}.size`, { required: true })}
                                className="border border-gray-200 rounded-lg px-2 py-1 w-20 uppercase outline-none focus:border-gray-400 transition"
                            />
                            <Controller
                                control={control}
                                name={`colors.${colorIndex}.sizes.${sizeIndex}.available`}
                                render={({field}) => (
                                    <CheckBox
                                        label="В наявності"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        colorOnChecked="text-gray-950"
                                        labelStyle="text-nowrap md:text-lg"
                                    />
                                )}
                            />

                            <ToolTip label="Видалити колір">
                                <FiTrash2
                                    className="size-7 md:size-8 text-red-400 hover:text-red-600 transition ml-auto cursor-pointer"
                                    onClick={() => removeSize(sizeIndex)}
                                />
                            </ToolTip>
                        </div>
                    )
                } )}

                <div className="flex flex-wrap gap-2">
                    {DEFAULT_SIZES.map((size) => (
                        <button
                            key={size}
                            type="button"
                            onClick={() => appendSize({ size, available: true })}
                            className="text-base md:text-lg border border-gray-200 rounded-lg px-3 py-1 hover:bg-gray-100 hover:border-gray-400 transition"
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
