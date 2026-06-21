import {Control, Controller, useFieldArray, UseFormRegister} from "react-hook-form";
import {TiDeleteOutline} from "react-icons/ti";
import ToolTip from "@/app/components/ToolTip";
import ImagesUpload from "@/app/(dashboard)/manageProducts/components/ImagesUpload";


type Props = {
    control:  Control<FormValues, any, FormValues>
    register: UseFormRegister<FormValues>
    colorIndex: number
    onRemoveColor: (colorIndex: number) => void
};

const DEFAULT_SIZES = ["S", "M", "L", "XL"];

const ColorBlock = ({ control, register, colorIndex, onRemoveColor }: Props) => {
    const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
        control,
        name: `colors.${colorIndex}.sizes`,
    });

    return (
        <div className="border border-gray-300 rounded-md p-4 flex flex-col gap-8">

            {/* Цвет */}
            <div className="flex items-center gap-6">
                <Controller
                    control={control}
                    name={`colors.${colorIndex}.color`}
                    render={({ field }) => (
                        <input type="color" {...field} className="w-10 h-10 rounded-md border border-gray-200 cursor-pointer" />
                    )}
                />
                <span className="text-base md:text-lg text-gray-500">Колір товару</span>
                <ToolTip label="Видалити колір">
                    <TiDeleteOutline
                        className="size-8 text-red-400 hover:text-red-600 transition ml-auto "
                        onClick={() => onRemoveColor(colorIndex)}
                    />
                </ToolTip>
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
            </div>

            {/* Размеры для этого цвета */}
            <div className="flex flex-col gap-2">
                <label className="text-base md:text-lg font-medium">Розміри</label>

                {sizeFields.map((sizeField, sizeIndex) => (
                    <div key={sizeField.id} className="flex items-center gap-6 bg-gray-50 rounded-md px-3 py-2">
                        <input
                            {...register(`colors.${colorIndex}.sizes.${sizeIndex}.size`, { required: true })}
                            className="border border-gray-200 rounded-sm px-2 py-1 w-20 uppercase outline-none focus:border-gray-400 transition"
                        />
                        <label className="flex items-center gap-2 text-base md:text-lg">
                            <input
                                type="checkbox"
                                className="size-5"
                                {...register(`colors.${colorIndex}.sizes.${sizeIndex}.available`)}
                                defaultChecked
                            />
                            В наявності
                        </label>
                        <ToolTip label="Видалити колір">
                            <TiDeleteOutline
                                className="size-8 text-red-400 hover:text-red-600 transition ml-auto"
                                onClick={() => removeSize(sizeIndex)}
                            />
                        </ToolTip>
                    </div>
                ))}

                <div className="flex flex-wrap gap-2">
                    {DEFAULT_SIZES.map((size) => (
                        <button
                            key={size}
                            type="button"
                            onClick={() => appendSize({ size, available: true })}
                            className="text-base md:text-lg border border-gray-200 rounded-md px-3 py-1 hover:bg-gray-100 hover:border-gray-400 transition"
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