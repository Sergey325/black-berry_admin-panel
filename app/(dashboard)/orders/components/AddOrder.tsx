import { useFieldArray, useForm, Controller, useWatch } from "react-hook-form";
import axios from "axios";
import { IProduct } from "@/app/actions/getProducts";
import {useEffect, useMemo, useState} from "react";
import toast from "react-hot-toast";
import {City, FormValuesOrder, Warehouse} from "@/app/types";
import NovaPoshtaSelect from "@/app/(dashboard)/orders/components/NovePoshtaSelect";
import ContactForm from "@/app/(dashboard)/orders/components/ContactForm";
import ToolTip from "@/app/components/ToolTip";
import {useRouter} from "next/navigation";
import {IoIosArrowBack} from "react-icons/io";
import {FiTrash2} from "react-icons/fi";
import Image from "next/image";
import SearchSelect, {SearchSelectOption} from "@/app/components/SearchSelect";

type Props = {
    products: IProduct[];
};

const AddOrder = ({products}: Props) => {
    const router = useRouter();
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

    const { register, control, handleSubmit, setValue, formState: { errors }, setError, clearErrors, reset } = useForm<FormValuesOrder>({
        defaultValues: {
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            comment: "",
            city: "",
            area: "",
            cityRef: "",
            warehouse: "",
            warehouseRef: "",
            paymentMethod: "MONOBANK",
            items: [],
        },
    });

    useEffect(() => {
        if (selectedCity) {
            setValue("city", selectedCity.name);
            setValue("area", selectedCity.area ?? "");
            setValue("cityRef", selectedCity.ref);
        }
    }, [selectedCity, setValue]);

    useEffect(() => {
        if (selectedWarehouse) {
            setValue("warehouse", selectedWarehouse.description);
            setValue("warehouseRef", selectedWarehouse.ref);
        }
    }, [selectedWarehouse, setValue]);

    const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
        control,
        name: "items",
        rules: {
            required: "Додайте хоча б один товар",
            minLength: {
                value: 1,
                message: "Додайте хоча б один товар",
            },
        },
    });

    const [paymentMethod, watchedItems] = useWatch({
        control,
        name: ["paymentMethod", "items"],
    });
    const productOptions = useMemo<SearchSelectOption[]>(() => products.map((product) => ({
        id: product.id,
        label: product.name,
        imageUrl: product.colors[0]?.images[0]?.url,
        description: `${product.price} грн`,
    })), [products]);

    const handleSelectProduct = (product: IProduct) => {
        const firstColor = product.colors[0];

        if (!firstColor) {
            toast.error("У товару немає доступних кольорів");
            return;
        }
        appendItem({
            productId: product.id,
            productColorId: firstColor.id,
            colorName: firstColor.colorName,
            name: product.name,
            color: firstColor.color,
            colorCode: firstColor.colorCode ?? "",
            size: firstColor.sizes[0]?.size ?? "",
            price: product.price,
            quantity: 1,
            imageUrl: firstColor.images[0]?.url ?? "",
        });
        clearErrors("items");
    };

    const totalAmount = watchedItems?.reduce((acc, item) => acc + (item?.price ?? 0) * (item?.quantity ?? 0), 0) ?? 0;

    const onSubmit = async (data: FormValuesOrder) => {
        try {
            if (!selectedCity || !selectedWarehouse) {
                toast.error("Введіть місто та виберіть відділення")
                document.getElementById("order-delivery")?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

                return;
            }
            else if (!data.items.length) {
                toast.error("Додайте товар замовлення")
                document.getElementById("order-items")?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

                return;
            }
            else {
                await axios.post("/api/order", {
                    ...data,
                    warehouseNumber: Number(selectedWarehouse?.number),
                    phone: data.phone.replace(/\D/g, "")
                }).then(() => {
                    toast.success("Замовлення створено!");
                    reset()
                    setSelectedCity(null)
                    setSelectedWarehouse(null)
                    router.replace("/orders")
                })
                .catch(() => {
                    toast.error("Something went wrong")
                })
            }
        } catch(error: unknown) {
            console.error(error);
            toast.error("Помилка створення замовлення");
        }
    };

    return (
        <div>
            <button type="button" className="group mb-5 inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-gray-950" onClick={() => router.replace("/orders?tab=AllOrders")}>
                <IoIosArrowBack className="size-5 group" />
                <span className="select-none">Повернутися до замовлень</span>
            </button>
            <form data-scroll-navigation onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

                <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                    <div className="mb-4">
                        <h2 className="font-semibold text-gray-900">Контактні дані</h2>
                        <p className="mt-1 text-base text-gray-600">Інформація про отримувача замовлення</p>
                    </div>
                    <div>
                        <ContactForm register={register} errors={errors} control={control}/>
                    </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                    <div className="mb-4">
                        <h2 className="font-semibold text-gray-900">Доставка</h2>
                        <p className="mt-1 text-base text-gray-600">Місто й відділення Нової пошти</p>
                    </div>
                    <div id="order-delivery">
                        <NovaPoshtaSelect
                            selectedCity={selectedCity}
                            setSelectedCity={setSelectedCity}
                            selectedWarehouse={selectedWarehouse}
                            setSelectedWarehouse={setSelectedWarehouse}
                        />
                    </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                    <h2 className="font-semibold text-gray-900">Спосіб оплати</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {(["MONOBANK", "CASH_ON_DELIVERY"] as const).map((method) => (
                            <label key={method} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-base font-medium transition ${paymentMethod === method ? "border-gray-900 bg-gray-50 text-gray-950" : "border-gray-200 text-gray-700 hover:border-gray-400"}`}>
                                <input type="radio" value={method} {...register("paymentMethod")} className="accent-black" />
                                <span>{method === "MONOBANK" ? "Онлайн (Monobank)" : "Накладений платіж"}</span>
                            </label>
                        ))}
                    </div>
                </section>

                <section id="order-items" className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                    <div>
                        <h2 className="font-semibold text-gray-900">Товари</h2>
                        <p className="mt-1 text-base text-gray-600">Додайте позиції та налаштуйте варіанти</p>
                    </div>

                    <SearchSelect
                        options={productOptions}
                        value={[]}
                        onChange={(selected) => {
                            const selectedProduct = products.find((product) => product.id === selected[0]?.id);
                            if (selectedProduct) handleSelectProduct(selectedProduct);
                        }}
                        placeholder="Пошук товару..."
                        showImages
                    />

                    {errors.items?.root && (
                        <p className="text-red-500 text-sm">
                            {errors.items.root.message}
                        </p>
                    )}
                    {itemFields.map((field, index) => {
                        const currentItem = watchedItems?.[index];
                        const product = products.find(p => p.id === currentItem?.productId);
                        const selectedColor = product?.colors.find(c => c.color === currentItem?.color);

                        return (
                            <div key={field.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                                <div className="flex items-center gap-3">
                                    {currentItem?.imageUrl && (
                                        <Image src={currentItem.imageUrl} width={48} height={48} className="size-12 rounded object-cover" alt="" />
                                    )}
                                    <p className="font-medium flex-1">{currentItem?.name}</p>
                                    <ToolTip label="Видалити">
                                        <FiTrash2
                                            onClick={() => {
                                                removeItem(index);
                                                if (itemFields.length === 1) {
                                                    setError("items", {
                                                        type: "manual",
                                                        message: "Додайте хоча б один товар",
                                                    });
                                                }
                                            }}
                                        className="size-5 cursor-pointer text-gray-500 transition hover:text-red-600"
                                        />
                                    </ToolTip>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Колір</label>
                                        <Controller
                                            control={control}
                                            name={`items.${index}.color`}
                                            render={({ field }) => (
                                                <select
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        const newColor = product?.colors.find(c => c.color === e.target.value);
                                                        if (newColor) {
                                                            setValue(`items.${index}.productColorId`, newColor.id);
                                                            setValue(`items.${index}.colorName`, newColor.colorName);
                                                            setValue(`items.${index}.colorCode`, newColor.colorCode ?? "");
                                                            setValue(`items.${index}.size`, newColor.sizes[0]?.size ?? "");
                                                            setValue(`items.${index}.imageUrl`, newColor.images[0]?.url ?? "");
                                                        }
                                                    }}
                                                    className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-base outline-none"
                                                >
                                                    {product?.colors.map(c => (
                                                        <option key={c.id} value={c.color} style={{backgroundColor: c.color, color: c.color === "#000000" ? "#ffffff" : "#000000"}} className="hover:opacity-70 ">
                                                            {c.colorName}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Розмір</label>
                                        <select
                                            {...register(`items.${index}.size`)}
                                            className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-base outline-none"
                                        >
                                            {selectedColor?.sizes.map(s => (
                                                <option key={s.id} value={s.size}>{s.size}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Ціна (грн)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            {...register(`items.${index}.price`, { valueAsNumber: true })}
                                            className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-base outline-none"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Кількість</label>
                                        <input
                                            type="number"
                                            min={1}
                                            {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 1 })}
                                            className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-base outline-none"
                                        />
                                    </div>

                                </div>
                            </div>
                        );
                    })}

                    {itemFields.length > 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3 text-white">
                            <span className="text-base text-gray-100">Сума замовлення</span>
                            <span className="font-semibold">{paymentMethod === "CASH_ON_DELIVERY" ? "150" : totalAmount.toLocaleString("uk-UA")} грн</span>
                        </div>
                    )}
                </section>

                <button type="submit" className="rounded-lg bg-black py-3 text-base font-medium text-white transition hover:bg-gray-800">
                    Створити замовлення
                </button>

            </form>
        </div>
    );
};

export default AddOrder;
