import {useFieldArray, useForm, useWatch} from "react-hook-form";
import axios from "axios";
import ColorBlock, {DEFAULT_SIZES} from "@/app/(dashboard)/products/components/ColorBlock";
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
    { code: "06", colorHex: "#FF9A44", colorName: "Рудий" },
    { code: "15", colorHex: "#D7EAE7", colorName: "М'ятний" },
    { code: "27", colorHex: "#C6B1C9", colorName: "Бузковий" },
    { code: "31", colorHex: "#ECCEDC", colorName: "Зефірний" },
    { code: "53", colorHex: "#61616D", colorName: "Темно-сірий" },
    { code: "55", colorHex: "#F3F2F0", colorName: "Білий" },
    { code: "62", colorHex: "#E7DFD4", colorName: "Молочний" },
    { code: "98", colorHex: "#E7A1CC", colorName: "Суха троянда" },
    { code: "106", colorHex: "#A4011E", colorName: "Червоний" },
    { code: "107", colorHex: "#B9083F", colorName: "Вишневий" },
    { code: "141", colorHex: "#153EAC", colorName: "Синій" },
    { code: "146", colorHex: "#D9D0E5", colorName: "Світло-лавандовий" },
    { code: "149", colorHex: "#BB2744", colorName: "Малиновий" },
    { code: "161", colorHex: "#FEE7E5", colorName: "Пудровий" },
    { code: "166", colorHex: "#9280B4", colorName: "Яскраво-лавандовий" },
    { code: "178", colorHex: "#CF6FA6", colorName: "Півонія" },
    { code: "185", colorHex: "#E4B5CA", colorName: "Рожевий" },
    { code: "216", colorHex: "#F6D34E", colorName: "Жовтий" },
    { code: "268", colorHex: "#B6A8A7", colorName: "Холодний бежевий" },
    { code: "287", colorHex: "#A5D1F1", colorName: "Блакитний" },
    { code: "310", colorHex: "#DFC8A6", colorName: "Шампань" },
    { code: "321", colorHex: "#6E4832", colorName: "Шоколадний" },
    { code: "343", colorHex: "#75787D", colorName: "Сірий" },
    { code: "377", colorHex: "#F180A7", colorName: "Яскраво-рожевий" },
    { code: "416", colorHex: "#C4C4CD", colorName: "Світло-сірий" },
    { code: "428", colorHex: "#A3A9B7", colorName: "Сірий" },
    { code: "485", colorHex: "#6A8045", colorName: "Зелений" },
    { code: "493", colorHex: "#371A13", colorName: "Гіркий шоколадний" },
    { code: "530", colorHex: "#A68E82", colorName: "Бежевий" },
    { code: "599", colorHex: "#C4BAAC", colorName: "Слонова кістка" },
    { code: "745", colorHex: "#D7D2D1", colorName: "Молочний" },
    { code: "754", colorHex: "#947E81", colorName: "Бежево-сірий" },
    { code: "775", colorHex: "#291516", colorName: "Шоколадний" },
    { code: "776", colorHex: "#C2C0D7", colorName: "Сіро-блакитний" },
    { code: "788", colorHex: "#C3B0E2", colorName: "Лавандовий" },
    { code: "796", colorHex: "#EBC4DB", colorName: "Рожевий" },
    { code: "1060", colorHex: "#291D1B", colorName: "Чорний" },
];

type Props = {
    product?: IProduct;
    products: IProduct[];
    materials: IMaterial[];
    categories: ICategory[];
    resetSelectedProduct: () => void;
}

const getContrastTextColor = (hexColor: string) => {
    const hex = hexColor.replace("#", "");
    const normalizedHex = hex.length === 3
        ? hex.split("").map((char) => `${char}${char}`).join("")
        : hex;

    const red = parseInt(normalizedHex.slice(0, 2), 16) / 255;
    const green = parseInt(normalizedHex.slice(2, 4), 16) / 255;
    const blue = parseInt(normalizedHex.slice(4, 6), 16) / 255;

    const toLinear = (value: number) =>
        value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

    const luminance =
        0.2126 * toLinear(red) +
        0.7152 * toLinear(green) +
        0.0722 * toLinear(blue);

    return luminance > 0.179 ? "#111827" : "#FFFFFF";
};

export default function AddProduct({product, products, materials, categories, resetSelectedProduct}: Props) {
    const router = useRouter();

    const { register, control, handleSubmit, formState: { errors }, reset, getValues, setValue, clearErrors } = useForm<FormValuesProduct>({
        defaultValues: {
            name: product?.name,
            description: product?.description || "",
            price: product?.price || 500,
            discount: product?.discount || 0,
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
                    quantity: s.quantity,
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
    const defaultSizes = useMemo(
        () => {
            const categorySizes = categories.find((category) => category.id === selectedCategoryId)?.defaultSizes;
            return categorySizes?.length ? categorySizes : DEFAULT_SIZES;
        },
        [categories, selectedCategoryId],
    );
    const createDefaultSizes = () => defaultSizes.map((size) => ({
        size,
        available: true,
        quantity: null,
    }));
    const productOptions = useMemo<SearchSelectOption[]>(() => products
        .filter((item) => item.id !== product?.id)
        .map((item) => ({
            id: item.id,
            label: item.name,
            imageUrl: item.colors[0]?.images[0]?.url,
            description: `${item.price} грн`,
        })), [product?.id, products]);
    const selectedRelatedProducts = useMemo<SearchSelectOption[]>(() => (watchedRelatedProducts ?? []).map((item) => {
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
            <button type="button" className="group mb-5 inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-gray-950" onClick={returnToProducts}>
                <IoIosArrowBack className="size-5 group" />
                <span className="select-none">Повернутися до товарів</span>
            </button>

            <form data-scroll-navigation onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Назва товару</label>
                    <input
                        {...register("name", { required: "Обов'язкове поле" })}
                        className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                    />
                    {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Опис товару</label>
                    <textarea
                        {...register("description")}
                        rows={5}
                        className="max-h-[240px] min-h-28 overflow-y-auto rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                    />
                    {errors.description && <span className="text-sm text-red-500">{errors.description.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Ціна</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register("price", { required: "Обов'язкове поле", valueAsNumber: true })}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                        />
                        {errors.price && <span className="text-sm text-red-500">{errors.price.message}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Знижка (%)</label>
                        <input
                            type="number"
                            {...register("discount", { valueAsNumber: true })}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                        />
                        {errors.discount && <span className="text-sm text-red-500">{errors.discount.message}</span>}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row md:justify-between items-start gap-5 w-full">
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
                    <h2 className="text-base font-semibold text-gray-900">Зв’язані товари</h2>
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
                            defaultSizes={defaultSizes}
                        />
                    ))}
                    <div className="flex items-center gap-4">
                        <label className="text-base font-semibold text-gray-900">Кольори товару</label>
                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_COLORS.map((item) => (
                                <ToolTip key={item.code + item.colorHex} label={item.colorName}>
                                    <button
                                        type="button"
                                        onClick={() => appendColor({ color: item.colorHex, images: [], sizes: createDefaultSizes(), colorName: item.colorName, colorCode: item.code, isBestSeller: false })}
                                        className="w-7 h-7 rounded-full border border-gray-500 hover:scale-110 transition text-xs text-center font-medium"
                                        style={{
                                            backgroundColor: item.colorHex,
                                            color: getContrastTextColor(item.colorHex),
                                        }}
                                    >
                                        {item.code}
                                    </button>
                                </ToolTip>
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
                        <p className="text-sm text-gray-500">Додайте хоча б один колір товару</p>
                    )}
                </div>
                <button type="submit" className="rounded-lg bg-black py-3 text-base font-medium text-white transition hover:bg-gray-800">
                    {product ? "Оновити товар" : "Зберегти товар"}
                </button>
            </form>
        </div>

    );
}
