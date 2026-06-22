import { useFieldArray, useForm } from "react-hook-form";
import axios from "axios";
import ColorBlock from "@/app/(dashboard)/manageProducts/components/ColorBlock";
import ToolTip from "@/app/components/ToolTip";
import slugify from "@/app/utils/slugify";
import {IProduct} from "@/app/actions/getProducts";
import toast from "react-hot-toast";
import {useRouter} from "next/navigation";
import {IoIosArrowBack} from "react-icons/io";


const DEFAULT_COLORS = [
    {
        color: "#000000",
        colorName: "Чорна"
    },
    {
        color: "#FFFFFF",
        colorName: "Біла"
    },
    {
        color: "#F7CCD3",
        colorName: "Рожева"
    },
    {
        color: "#E1D1B7",
        colorName: "Бежева"
    },
    {
        color: "#EA3637",
        colorName: "Червона"
    },
    {
        color: "#FCD64D",
        colorName: "Жовта"
    },
    {
        color: "#D3B4E0",
        colorName: "Бузкова"
    },
];

type Props = {
    product?: IProduct;
    resetSelectedProduct: () => void;
}
const desc = "Стильна та зручна панамка — ідеальний вибір для сонячних днів. Легка тканина забезпечує комфорт у носінні, а продуманий крій допомагає захистити обличчя від сонця.\n" +
    "\n" +
    "Завдяки універсальному дизайну панамка стане практичним доповненням гардероба для прогулянок, відпочинку на природі чи подорожей. Вона зберігає охайний вигляд навіть при активному використанні та дарує комфорт протягом усього дня.\n" +
    "\n" +
    "Добре поєднується як із повсякденними, так і з літніми образами."
export default function AddProduct({product, resetSelectedProduct}: Props) {
    const router = useRouter();

    const { register, control, handleSubmit, formState: { errors }, reset, getValues } = useForm<FormValues>({
        defaultValues: {
            name: product?.name,
            description: product?.description || desc,
            price: product?.price || 500,
            discount: product?.discount || 0,
            colors: product?.colors.map((c) => ({
                color: c.color,
                colorName: c.colorName,
                images: c.images
                    .sort((a, b) => a.order - b.order)
                    .map((img) => img.url),
                sizes: c.sizes.map((s) => ({
                    size: s.size,
                    available: s.available,
                })),
            })) || [],
        },
    });

    const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
        control,
        name: "colors",
    });

    const onSubmit = async (data: FormValues) => {
        // console.log(data)
        if (data.colors.length === 0) {
            toast.error("Додайте хоча б один колір товару");
            return;
        }

        for (const color of data.colors) {
            if (color.images.length === 0) {
                toast.error(`Додайте зображення для кольору`);
                return;
            }
            if (color.sizes.length === 0) {
                toast.error(`Додайте хоча б один розмір для кожного кольору`);
                return;
            }
        }

        axios.post("/api/product", {
            ...data,
            id: product?.id || null,
            slug: slugify(data.name)
        }).then(() => {
            toast.success(product?.id ? "Product updated!" : "Product created!")
            reset({
                name: "",
                description: desc,
                price: 500,
                discount: 0,
                colors: [],

            })
            resetSelectedProduct()
            router.refresh()
        })
        .catch(() => {
            toast.error("Something went wrong")
        })
    };

    const handleDeleteColor = async (colorIndex: number) => {
        const colors = getValues("colors");
        const images = colors[colorIndex].images;

        images.forEach((image, i) => {
            axios.delete("/api/image", {
                data: {
                    publicId: image.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)?.[1],
                },
            })
            .catch((error) => {
                toast.error(error?.response?.data?.error);
            })
        })

        removeColor(colorIndex)
    }

    return (
        <div>

            <div className="flex items-center gap-1 mb-5 group cursor-pointer" onClick={() => router.replace("/manageProducts?tab=AllProducts")}>
                <IoIosArrowBack className="size-5 group" />
                <p className="group-hover:underline group">Повернутися до товарів</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 bg-white rounded-md p-3 border border-gray-300 md:p-5">

                <div className="flex flex-col gap-1">
                    <label className="text-base md:text-lg font-medium">Назва товару</label>
                    <input
                        {...register("name", { required: "Обов'язкове поле" })}
                        className="border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition md:text-lg"
                    />
                    {errors.name && <span className="text-red-500 text-base md:text-lg">{errors.name.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-base md:text-lg font-medium">Опис товару</label>
                    <textarea
                        {...register("description", { required: "Обов'язкове поле" })}
                        rows={5}
                        className="border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition max-h-[200px] min-h-[45px] overflow-y-auto md:text-lg"
                    />
                    {errors.description && <span className="text-red-500 text-base md:text-lg">{errors.description.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-base md:text-lg font-medium">Ціна</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register("price", { required: "Обов'язкове поле", valueAsNumber: true })}
                            className="border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition md:text-lg"
                        />
                        {errors.price && <span className="text-red-500 text-base md:text-lg">{errors.price.message}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-base md:text-lg font-medium">Знижка (%)</label>
                        <input
                            type="number"
                            {...register("discount", { valueAsNumber: true })}
                            className="border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition md:text-lg"
                        />
                        {errors.discount && <span className="text-red-500 text-base md:text-lg">{errors.discount.message}</span>}
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    {colorFields.map((colorField, colorIndex) => (
                        <ColorBlock
                            key={colorField.id}
                            control={control}
                            register={register}
                            colorIndex={colorIndex}
                            onRemoveColor={() => handleDeleteColor(colorIndex)}
                            errors={errors}
                        />
                    ))}
                    <div className="flex items-center gap-4">
                        <label className="text-base md:text-lg font-medium">Кольори товару</label>
                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_COLORS.map((item) => (
                                <button
                                    key={item.color+item.colorName}
                                    type="button"
                                    onClick={() => appendColor({ color: item.color, images: [], sizes: [{size: "S", available: true}, {size: "M", available: true}], colorName: item.colorName })}
                                    className="w-7 h-7 rounded-full border border-gray-500 hover:scale-110 transition"
                                    style={{ backgroundColor: item.color }}
                                />
                            ))}
                            <ToolTip label="Додати колір">
                                <button
                                    type="button"
                                    onClick={() => appendColor({ color: "#000000", images: [], sizes: [], colorName: "" })}
                                    className="w-7 h-7 rounded-full border border-gray-300 border-dashed flex items-center justify-center text-gray-400 hover:text-gray-800 hover:border-gray-500 transition text-center cursor-pointer"
                                >
                                    +
                                </button>
                            </ToolTip>
                        </div>
                    </div>
                    {colorFields.length === 0 && (
                        <p className="text-base md:text-lg text-gray-400">Додайте хоча б один колір товару</p>
                    )}
                </div>
                <button type="submit" className="bg-black text-white rounded-sm py-3 hover:bg-gray-800 transition">
                    Зберегти товар
                </button>
            </form>
        </div>

    );
}