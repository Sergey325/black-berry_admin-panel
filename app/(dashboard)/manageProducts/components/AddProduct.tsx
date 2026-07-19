import {useFieldArray, useForm} from "react-hook-form";
import axios from "axios";
import ColorBlock from "@/app/(dashboard)/manageProducts/components/ColorBlock";
import ToolTip from "@/app/components/ToolTip";
import {IProduct} from "@/app/actions/getProducts";
import toast from "react-hot-toast";
import {useRouter} from "next/navigation";
import {IoIosArrowBack} from "react-icons/io";
import {FormValuesProduct} from "@/app/types";
import {IMaterial} from "@/app/actions/getMaterials";
import {useMemo, useRef, useState} from "react";
import {ICategory} from "@/app/actions/getCategories";
import {optimizeCloudinaryUrl} from "@/app/utils/optimizeCloudinaryImage";
import {MdDelete} from "react-icons/md";
import Materials from "@/app/(dashboard)/manageProducts/components/Materials";
import slugify from "@/app/utils/slugify";


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
const desc = "Стильна та зручна панамка — ідеальний вибір для сонячних днів. Легка тканина забезпечує комфорт у носінні, а продуманий крій допомагає захистити обличчя від сонця.\n" +
    "\n" +
    "Завдяки універсальному дизайну панамка стане практичним доповненням гардероба для прогулянок, відпочинку на природі чи подорожей. Вона зберігає охайний вигляд навіть при активному використанні та дарує комфорт протягом усього дня.\n" +
    "\n" +
    "Добре поєднується як із повсякденними, так і з літніми образами."
export default function AddProduct({product, products, materials, categories, resetSelectedProduct}: Props) {
    const router = useRouter();
    const [searchCategory, setSearchCategory] = useState("");
    const [searchProduct, setSearchProduct] = useState("");
    const [dropdownCategoryOpen, setDropdownCategoryOpen] = useState(false);
    const [dropdownProductsOpen, setDropdownProductsOpen] = useState(false);
    const categoryRef = useRef<HTMLDivElement | null>(null);

    const { register, control, handleSubmit, formState: { errors }, reset, getValues, setValue, clearErrors, watch, setError } = useForm<FormValuesProduct>({
        defaultValues: {
            name: product?.name,
            description: product?.description || desc,
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
            relatedProducts: product?.relatedTo?.map(p => {return {id: p.id, name: p.name, imageUrl: p.colors[0].images[0].url}}) || []
        },
    });



    const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
        control,
        name: "colors",
    });


    const onSubmit = async (data: FormValuesProduct) => {
        console.log(data)

        if (!data.categoryId) {
            toast.error("Виберіть категорію");
            categoryRef.current?.scrollIntoView({
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



    const selectedCategoryId = watch("categoryId");

    const selectedCategory = useMemo(() => {
        return categories.find(category => category.id === selectedCategoryId);
    }, [selectedCategoryId])

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchCategory.toLowerCase())
    );

    const handleSelectCategory = (categoryId: number) => {
        setValue("categoryId", categoryId)
        clearErrors("categoryId");
        setSearchCategory("");
        setDropdownCategoryOpen(false);
    };

    const { fields: relatedProductsFields, append: appendRelatedProduct, remove: removeRelatedProduct } = useFieldArray({
        control,
        name: "relatedProducts",
    });

    const watchedRelatedProducts = watch("relatedProducts");

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase())
    );

    const handleSelectProduct = (product: IProduct) => {
        const firstColor = product.colors[0];
        appendRelatedProduct({
            id: product.id,
            name: product.name,
            imageUrl: firstColor.images[0]?.url ?? "",
        });
        clearErrors("relatedProducts");
        setSearchProduct("");
        setDropdownProductsOpen(false);
    };

    return (
        <div>

            <div className="flex items-center gap-1 mb-5 group cursor-pointer" onClick={() => router.replace("/manageProducts?tab=AllProducts")}>
                <IoIosArrowBack className="size-5 group" />
                <p className="group-hover:underline group select-none">Повернутися до товарів</p>
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

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                    <div className="flex flex-col gap-1">
                        <label className="text-base md:text-lg font-medium">Кількість</label>
                        <input
                            type="number"
                            step="1"
                            {...register("quantity", { valueAsNumber: true })}
                            className="border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition md:text-lg"
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:justify-between items-start gap-5 w-full">
                    <Materials materialsList={materials} initialValue={product?.material} onSelectedValueChange={(material: IMaterial) => setValue("materialId", material.id)}/>
                    {selectedCategory ? (
                        <div className="flex items-center justify-between gap-3 border rounded-md px-2 py-1 bg-gray-50 w-full">
                            <div className="flex items-center gap-3">
                                <img
                                    src={optimizeCloudinaryUrl(selectedCategory.coverImage, 200)}
                                    className="w-14 aspect-5/3 object-cover rounded"
                                    alt=""
                                />
                                <div>
                                    <p className="font-medium">{selectedCategory.name}</p>
                                    {/*<p className="text-xs text-gray-500">{selectedCategory.slug}</p>*/}
                                </div>
                            </div>

                            <MdDelete
                                onClick={() => setValue("categoryId", null)}
                                className="text-red-500 size-5 mr-2 hover:scale-105 transition-transform cursor-pointer"
                            />
                        </div>
                    ) : (
                        <div className="relative w-full" ref={categoryRef}>
                            <input
                                type="text"
                                value={searchCategory}
                                onChange={(e) => { setSearchCategory(e.target.value); setDropdownCategoryOpen(true); }}
                                onFocus={() => setDropdownCategoryOpen(true)}
                                placeholder="Пошук категорії..."
                                className="border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition w-full bg-white"
                            />
                            {dropdownCategoryOpen && searchCategory && filteredCategories.length > 0 && (
                                <div className="absolute z-10 bottom-full w-full min-w-70 sm:min-w-75 mb-1 bg-gray-200 border-2 border-gray-800 rounded-md mt-1 max-h-100 overflow-auto shadow-md">
                                    {filteredCategories.map((category) => (
                                        <div
                                            key={category.id}
                                            onClick={() => handleSelectCategory(category.id)}
                                            className="px-4 py-2 hover:bg-gray-300 cursor-pointer flex items-center gap-3"
                                        >
                                            {category.coverImage && (
                                                <img src={optimizeCloudinaryUrl(category.coverImage, 200) } className="w-12 aspect-5/3 object-cover rounded" alt=""/>
                                            )}
                                            <span className="truncate">{category.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Товары */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-medium">Зв'язані товари</h2>

                    {/* Поиск и добавление товара */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchProduct}
                            onChange={(e) => { setSearchProduct(e.target.value); setDropdownProductsOpen(true); }}
                            onFocus={() => setDropdownProductsOpen(true)}
                            placeholder="Пошук товару..."
                            className="border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition w-full bg-white"
                        />
                        {dropdownProductsOpen && searchProduct && filteredProducts.length > 0 && (
                            <div className="absolute z-10 bottom-full w-full mb-1 bg-gray-200 border-2 border-gray-800 rounded-md mt-1 max-h-100 overflow-auto shadow-md">
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => handleSelectProduct(product)}
                                        className="px-4 py-2 hover:bg-gray-300 cursor-pointer flex items-center gap-3"
                                    >
                                        {product.colors[0]?.images[0]?.url && (
                                            <img src={optimizeCloudinaryUrl(product.colors[0].images[0].url, 80)} className="w-8 h-8 object-cover rounded" alt="" />
                                        )}
                                        <span>{product.name}</span>
                                        <span className="ml-auto text-gray-600">{product.price} грн</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>


                    {errors.relatedProducts?.root && (
                        <p className="text-red-500 text-sm">
                            {errors.relatedProducts.root.message}
                        </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {relatedProductsFields.map((field, index) => {
                            const relatedProduct = watchedRelatedProducts[index];
                            return (
                                <div key={field.id} className="border border-gray-200 bg-white rounded-md px-2 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        {relatedProduct.imageUrl && (
                                            <img src={optimizeCloudinaryUrl(relatedProduct.imageUrl, 100)} className="w-12 h-12 object-cover rounded" alt="" />
                                        )}
                                        <p className="font-medium flex-1">{relatedProduct.name}</p>
                                        <ToolTip label="Видалити">
                                            <MdDelete
                                                onClick={() => {
                                                    removeRelatedProduct(index);
                                                    if (relatedProductsFields.length === 1) {
                                                        setError("relatedProducts", {
                                                            type: "manual",
                                                            message: "Додайте хоча б один зв'язаний продукт",
                                                        });
                                                    }
                                                }}
                                                className="size-6 md:size-7 text-gray-500 hover:text-red-600 transition cursor-pointer"
                                            />
                                        </ToolTip>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    {colorFields.map((colorField, colorIndex) => (
                        <ColorBlock
                            key={colorField.id}
                            control={control}
                            register={register}
                            colorIndex={colorIndex}
                            isBestSeller={colorField.isBestSeller}
                            onRemoveColor={() => handleDeleteColor(colorIndex)}
                            errors={errors}
                            getValues={getValues}
                            setValue={setValue}
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
                <button type="submit" className="bg-black text-white rounded-sm py-3 hover:bg-gray-800 transition">
                    Зберегти товар
                </button>
            </form>
        </div>

    );
}