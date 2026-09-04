import {Controller, useFieldArray, useForm, useWatch} from "react-hook-form";
import axios from "axios";
import {IOrderProduct} from "@/app/actions/getProducts";
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
import ImagesUpload from "@/app/components/ImagesUpload";
import {FiPlus} from "react-icons/fi";
import Dropdown from "@/app/components/DropDown";
import type {IOrder} from "@/app/actions/getOrders";
import type {TrafficSource} from "@prisma/client";

type Props = {
    products: IOrderProduct[];
    order?: IOrder;
};

const trafficSourceOptions = [
    {value: "FACEBOOK", label: "Facebook"},
    {value: "INSTAGRAM", label: "Instagram"},
    {value: "GOOGLE_SEARCH", label: "Google Search"},
    {value: "GOOGLE_FREE_LISTING", label: "Google Free Listing"},
] satisfies {value: TrafficSource; label: string}[];

const AddOrder = ({products, order}: Props) => {
    const router = useRouter();
    const [selectedCity, setSelectedCity] = useState<City | null>(() => order?.city ? {
        ref: order.cityRef ?? "",
        name: order.city,
        area: order.area ?? "",
    } : null);
    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(() => order?.warehouse ? {
        ref: order.warehouseRef ?? "",
        number: order.warehouseNumber?.toString() ?? "",
        description: order.warehouse,
    } : null);

    const { register, control, handleSubmit, setValue, formState: { errors }, setError, clearErrors, reset } = useForm<FormValuesOrder>({
        defaultValues: {
            firstName: order?.firstName ?? "",
            lastName: order?.lastName ?? "",
            phone: order?.phone ?? "",
            email: order?.email ?? "",
            comment: order?.comment ?? "",
            city: order?.city ?? "",
            area: order?.area ?? "",
            cityRef: order?.cityRef ?? "",
            warehouse: order?.warehouse ?? "",
            warehouseRef: order?.warehouseRef ?? "",
            ttnNumber: order?.ttnNumber ?? "",
            paymentMethod: order?.paymentMethod ?? "MONOBANK",
            trafficSource: order?.trafficSource ?? null,
            items: order?.items.map((item) => ({
                productId: item.productId,
                productColorId: null,
                name: item.name,
                color: item.color ?? "",
                colorName: item.colorName ?? "",
                colorCode: item.colorCode ?? "",
                size: item.size ?? "",
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl ?? "",
                isCustom: item.isCustom,
            })) ?? [],
        },
    });

    useEffect(() => {
        setValue("city", selectedCity?.name ?? "");
        setValue("area", selectedCity?.area ?? "");
        setValue("cityRef", selectedCity?.ref ?? "");
    }, [selectedCity, setValue]);

    useEffect(() => {
        setValue("warehouse", selectedWarehouse?.description ?? "");
        setValue("warehouseRef", selectedWarehouse?.ref ?? "");
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

    const handleSelectProduct = (product: IOrderProduct) => {
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
            isCustom: false,
        });
        clearErrors("items");
    };

    const handleAddCustomProduct = () => {
        appendItem({
            productId: null,
            productColorId: null,
            name: "",
            color: "",
            colorName: "",
            colorCode: "",
            size: "",
            price: 0,
            quantity: 1,
            imageUrl: "",
            isCustom: true,
        });
        clearErrors("items");
    };

    const totalAmount = watchedItems?.reduce((acc, item) => acc + (item?.price ?? 0) * (item?.quantity ?? 0), 0) ?? 0;

    const onSubmit = async (data: FormValuesOrder) => {
        try {
            // if (!selectedCity || !selectedWarehouse) {
            //     toast.error("Введіть місто та виберіть відділення")
            //     document.getElementById("order-delivery")?.scrollIntoView({
            //         behavior: "smooth",
            //         block: "center",
            //     });
            //
            //     return;
            // }
            if (!data.items.length) {
                toast.error("Додайте товар замовлення")
                document.getElementById("order-items")?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

                return;
            }
            else {
                const payload = {
                    ...data,
                    warehouseNumber: selectedWarehouse?.number ? Number(selectedWarehouse.number) : null,
                    phone: data.phone.replace(/\D/g, ""),
                    ttnNumber: data.ttnNumber.trim(),
                };

                if (order) {
                    await axios.patch(`/api/order/${order.id}`, payload);
                    toast.success("Замовлення оновлено!");
                } else {
                    await axios.post("/api/order", payload);
                    toast.success("Замовлення створено!");
                }

                reset();
                setSelectedCity(null);
                setSelectedWarehouse(null);
                router.replace("/orders");
            }
        } catch(error: unknown) {
            console.error(error);
            toast.error(order ? "Помилка оновлення замовлення" : "Помилка створення замовлення");
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
                    {order && (
                        <div className="mt-4 flex flex-col gap-1">
                            <label className="text-base font-medium text-gray-700">Номер ТТН</label>
                            <input
                                inputMode="numeric"
                                maxLength={14}
                                placeholder="14 цифр"
                                {...register("ttnNumber", {
                                    validate: (value) => !value || /^\d{14}$/.test(value) || "ТТН має містити 14 цифр",
                                })}
                                className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                            />
                            {errors.ttnNumber && <p className="text-sm text-red-500">{errors.ttnNumber.message}</p>}
                        </div>
                    )}
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                    <div className="mb-4">
                        <h2 className="font-semibold text-gray-900">Джерело замовлення</h2>
                        <p className="mt-1 text-base text-gray-600">Звідки клієнт дізнався про магазин</p>
                    </div>
                    <Controller
                        control={control}
                        name="trafficSource"
                        render={({field}) => (
                            <Dropdown<TrafficSource | null>
                                options={trafficSourceOptions}
                                value={field.value}
                                onChange={(option) => field.onChange(option.value)}
                                placeholder="Оберіть джерело"
                            />
                        )}
                    />
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

                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
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
                        <button
                            type="button"
                            onClick={handleAddCustomProduct}
                            className="inline-flex h-[41.6px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base font-medium text-gray-800 transition hover:border-gray-500 hover:bg-gray-50"
                        >
                            <FiPlus className="size-5"/>
                            Додати власний товар
                        </button>
                    </div>

                    {errors.items?.root && (
                        <p className="text-red-500 text-sm">
                            {errors.items.root.message}
                        </p>
                    )}
                    {itemFields.map((field, index) => {
                        const currentItem = watchedItems?.[index];
                        const product = products.find(p => p.id === currentItem?.productId);
                        const selectedColor = product?.colors.find(c => c.color === currentItem?.color);
                        const isCustom = currentItem?.isCustom ?? field.isCustom;
                        const colorsOptions =
                            product?.colors.map(color => {
                                return {
                                    value: color.color,
                                    label: color.colorName,
                                    onClick: () => {
                                        setValue(`items.${index}.productColorId`, color.id);
                                        setValue(`items.${index}.colorName`, color.colorName);
                                        setValue(`items.${index}.colorCode`, color.colorCode ?? "");
                                        setValue(`items.${index}.size`, color.sizes[0]?.size ?? "");
                                        setValue(`items.${index}.imageUrl`, color.images[0]?.url ?? "");
                                    }
                                }
                            }) || []

                        const sizesOptions =
                            selectedColor?.sizes.map(size => {
                                return {
                                    value: size.size,
                                    label:size.size,
                                    onClick: () => setValue(`items.${index}.size`, size.size)
                                }
                            }) || []


                        return (
                            <div key={field.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4">

                                <div className="flex items-center justify-center gap-3">
                                    {currentItem?.imageUrl && (
                                        <Image src={currentItem.imageUrl} width={48} height={48} className="size-12 rounded object-cover" alt="" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        {isCustom ? (
                                            <>
                                                <input
                                                    {...register(`items.${index}.name`, {required: "Введіть назву товару"})}
                                                    placeholder="Назва товару*"
                                                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                                />
                                                {errors.items?.[index]?.name && (
                                                    <p className="mt-1 text-sm text-red-500">{errors.items[index].name.message}</p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="font-medium">{currentItem?.name}</p>
                                        )}
                                    </div>
                                    <ToolTip label="Видалити">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                removeItem(index);
                                                if (itemFields.length === 1) {
                                                    setError("items", {
                                                        type: "manual",
                                                        message: "Додайте хоча б один товар",
                                                    });
                                                }
                                            }}
                                            className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                                            aria-label="Видалити товар"
                                        >
                                            <FiTrash2 className="size-5"/>
                                        </button>
                                    </ToolTip>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Колір</label>
                                        {isCustom ? (
                                            <input
                                                {...register(`items.${index}.colorName`)}
                                                placeholder="Необов'язково"
                                                className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-base outline-none"
                                            />
                                        ) : (
                                            <Dropdown
                                                value={currentItem?.color}
                                                options={colorsOptions}
                                                className="min-w-0"
                                                buttonClassName={"rounded-lg! px-2! sm:px-4!"}
                                            />
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Розмір</label>
                                        {isCustom ? (
                                            <input
                                                {...register(`items.${index}.size`)}
                                                placeholder="Необов'язково"
                                                className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-base outline-none"
                                            />
                                        ) : (
                                            <Dropdown
                                                value={currentItem?.size}
                                                options={sizesOptions}
                                                className="min-w-0"
                                                buttonClassName={"rounded-lg! px-2! sm:px-4!"}
                                            />
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Ціна (грн)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            {...register(`items.${index}.price`, {
                                                valueAsNumber: true,
                                                required: "Введіть ціну",
                                                min: {value: 1, message: "Мінімальна ціна — 1 грн"},
                                            })}
                                            className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-base outline-none"
                                        />
                                        {errors.items?.[index]?.price && (
                                            <p className="text-sm text-red-500">{errors.items[index].price.message}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Кількість</label>
                                        <input
                                            type="number"
                                            min={1}
                                            {...register(`items.${index}.quantity`, {
                                                valueAsNumber: true,
                                                required: "Введіть кількість",
                                                min: {value: 1, message: "Мінімальна кількість — 1"},
                                            })}
                                            className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-base outline-none"
                                        />
                                        {errors.items?.[index]?.quantity && (
                                            <p className="text-sm text-red-500">{errors.items[index].quantity.message}</p>
                                        )}
                                    </div>

                                </div>
                                {isCustom && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-gray-700">Зображення</label>
                                        <ImagesUpload
                                            value={currentItem?.imageUrl ? [currentItem.imageUrl] : []}
                                            onChange={(images) => setValue(`items.${index}.imageUrl`, images[0] ?? "", {shouldDirty: true})}
                                            folder="BlackBerry/Orders/CustomItems"
                                            maxFiles={1}
                                            multiple={false}
                                            uploadLabel="Додати зображення (необов'язково)"
                                        />
                                    </div>
                                )}
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
                    {order ? "Оновити замовлення" : "Створити замовлення"}
                </button>

            </form>
        </div>
    );
};

export default AddOrder;
