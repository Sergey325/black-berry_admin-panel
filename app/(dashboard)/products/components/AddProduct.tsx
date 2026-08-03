import {useFieldArray, useForm, useWatch} from "react-hook-form";
import axios from "axios";
import ColorBlock from "@/app/(dashboard)/products/components/ColorBlock";
import ToolTip from "@/app/components/ToolTip";
import {IProduct} from "@/app/actions/getProducts";
import toast from "react-hot-toast";
import {useRouter} from "next/navigation";
import {IoIosArrowBack} from "react-icons/io";
import {FormValuesProduct} from "@/app/types";
import {IMaterial} from "@/app/actions/getMaterials";
import {useMemo} from "react";
import {ICategory} from "@/app/actions/getCategories";
import Materials from "@/app/(dashboard)/products/components/Materials";
import slugify from "@/app/utils/slugify";
import SearchSelect, {SearchSelectOption} from "@/app/components/SearchSelect";


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
    products: IProduct[];
    materials: IMaterial[];
    categories: ICategory[];
    resetSelectedProduct: () => void;
}

export default function AddProduct({product, products, materials, categories, resetSelectedProduct}: Props) {
    const router = useRouter();

    const { register, control, handleSubmit, formState: { errors }, reset, getValues, setValue, clearErrors } = useForm<FormValuesProduct>({
        defaultValues: {
            name: product?.name,
            description: product?.description || "",
            price: product?.price || 500,
            discount: product?.discount || 0,
            quantity: product?.quantity || null,
            materialId: product?.material?.id || undefined,
            categoryId: product?.category?.id || null,
            colors: product?.colors.map((c) => ({
                color: c.color,
                colorName: c.colorName,
                colorCode: c.colorCode || null,
                isBestSeller: c.isBestSeller || false,
                images: c.images
                    .sort((a, b) => a.order - b.order)
                    .map((img) => img.url),
                sizes: c.sizes.map((s) => ({
                    size: s.size,
                    available: s.available,
                })),
            })) || [],
            relatedProducts: product?.relatedTo?.map(p => ({
                id: p.id,
                name: p.name,
                imageUrl: p.colors[0]?.images[0]?.url ?? "",
            })) || []
        },
    });



    const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
        control,
        name: "colors",
    });


    const onSubmit = async (data: FormValuesProduct) => {
        if (!data.categoryId) {
            toast.error("Виберіть категорію");
            document.getElementById("product-category-select")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            return;
        }

        if (!data.materialId) {
            toast.error("Виберіть матеріал");
            return;
        }

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
            toast.success(product?.id ? "Продукт оновлено!" : "Продукт створено!")
            reset({
                name: "",
                description: "",
                price: 500,
                discount: 0,
                colors: [],

            })
            resetSelectedProduct()
            router.replace("/products?tab=AllProducts")
            router.refresh()
        })
        .catch(() => {
            toast.error("Something went wrong")
        })
    };

    const handleDeleteColor = async (colorIndex: number) => {
        const colors = getValues("colors");
        const images = colors[colorIndex].images;

        images.forEach((image) => {
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



    const [selectedCategoryId, watchedRelatedProducts] = useWatch({
        control,
        name: ["categoryId", "relatedProducts"],
    });

    const categoryOptions = useMemo<SearchSelectOption[]>(() => categories.map((category) => ({
        id: category.id,
        label: category.name,
        imageUrl: category.coverImage,
    })), [categories]);
    const selectedCategory = useMemo(
        () => categoryOptions.filter((category) => category.id === selectedCategoryId),
        [categoryOptions, selectedCategoryId],
    );
    const productOptions = useMemo<SearchSelectOption[]>(() => products
        .filter((item) => item.id !== product?.id)
        .map((item) => ({
            id: item.id,
            label: item.name,
            imageUrl: item.colors[0]?.images[0]?.url,
            description: `${item.price} грн`,
        })), [product?.id, products]);
    const selectedRelatedProducts = useMemo<SearchSelectOption[]>(() => watchedRelatedProducts.map((item) => {
        const option = productOptions.find((productOption) => productOption.id === item.id);
        return {
            id: item.id,
            label: item.name,
            imageUrl: item.imageUrl,
            description: option?.description,
        };
    }), [productOptions, watchedRelatedProducts]);

    const returnToProducts = () => {
        resetSelectedProduct();
        router.replace("/products?tab=AllProducts");
    };

    return (
        <div>
            <div className="flex items-center gap-1 mb-5 group cursor-pointer" onClick={returnToProducts}>
                <IoIosArrowBack className="size-5 group" />
                <p className="group-hover:underline group select-none">Повернутися до товарів</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 bg-white rounded-xl p-3 border border-gray-300 md:p-5">

                <div className="flex flex-col gap-1">
                    <label className="text-base md:text-lg font-medium">Назва товару</label>
                    <input
                        {...register("name", { required: "Обов'язкове поле" })}
                        className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-600 transition md:text-lg"
                    />
                    {errors.name && <span className="text-red-500 text-base md:text-lg">{errors.name.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-base md:text-lg font-medium">Опис товару</label>
                    <textarea
                        {...register("description")}
                        rows={5}
                        className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-600 transition max-h-[200px] min-h-[45px] overflow-y-auto md:text-lg"
                    />
                    {errors.description && <span className="text-red-500 text-base md:text-lg">{errors.description.message}</span>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-base md:text-lg font-medium">Ціна</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register("price", { required: "Обов'язкове поле", valueAsNumber: true })}
                            className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-600 transition md:text-lg"
                        />
                        {errors.price && <span className="text-red-500 text-base md:text-lg">{errors.price.message}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-base md:text-lg font-medium">Знижка (%)</label>
                        <input
                            type="number"
                            {...register("discount", { valueAsNumber: true })}
                            className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-600 transition md:text-lg"
                        />
                        {errors.discount && <span className="text-red-500 text-base md:text-lg">{errors.discount.message}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-base md:text-lg font-medium">Кількість</label>
                        <input
                            type="number"
                            step="1"
                            {...register("quantity", { valueAsNumber: true })}
                            className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-600 transition md:text-lg"
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:justify-between items-start gap-5 w-full">
                    <Materials materialsList={materials} initialValue={product?.material} onSelectedValueChange={(material: IMaterial) => setValue("materialId", material.id)}/>
                    <div id="product-category-select" className="w-full">
                        <SearchSelect
                            options={categoryOptions}
                            value={selectedCategory}
                            onChange={(selected) => {
                                setValue("categoryId", selected[0]?.id ?? null, {shouldDirty: true});
                                clearErrors("categoryId");
                            }}
                            placeholder="Пошук категорії..."
                            showImages
                            imageFit="contain"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-medium">Зв’язані товари</h2>
                    <SearchSelect
                        multiple
                        options={productOptions}
                        value={selectedRelatedProducts}
                        onChange={(selected) => setValue("relatedProducts", selected.map((item) => ({
                            id: item.id,
                            name: item.label,
                            imageUrl: item.imageUrl ?? "",
                        })), {shouldDirty: true})}
                        placeholder="Пошук товару..."
                        showImages
                    />
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
                                    onClick={() => appendColor({ color: item.color, images: [], sizes: [{size: "S", available: true}, {size: "M", available: true}], colorName: item.colorName, colorCode: null, isBestSeller: false })}
                                    className="w-7 h-7 rounded-full border border-gray-500 hover:scale-110 transition"
                                    style={{ backgroundColor: item.color }}
                                />
                            ))}
                            <ToolTip label="Додати колір">
                                <button
                                    type="button"
                                    onClick={() => appendColor({ color: "#000000", images: [], sizes: [], colorName: "", colorCode: null, isBestSeller: false })}
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
                <button type="submit" className="bg-black text-white rounded-xl py-3 hover:bg-gray-800 transition">
                    Зберегти товар
                </button>
            </form>
        </div>

    );
}
