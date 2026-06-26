import { useFieldArray, useForm, Controller, useWatch } from "react-hook-form";
import axios from "axios";
import { IProduct } from "@/app/actions/getProducts";
import {useEffect, useRef, useState} from "react";
import toast from "react-hot-toast";
import {City, FormValuesOrder, Warehouse} from "@/app/types";
import NovaPoshtaSelect from "@/app/(dashboard)/manageOrders/components/NovePoshtaSelect";
import ContactForm from "@/app/(dashboard)/manageOrders/components/ContactForm";
import useClickOutside from "@/app/hooks/useClickOutside";
import {MdDelete} from "react-icons/md";
import ToolTip from "@/app/components/ToolTip";
import {useRouter} from "next/navigation";
import {IoIosArrowBack} from "react-icons/io";

type Props = {
    products: IProduct[];
};

const AddOrder = ({products}: Props) => {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

    const contactRef = useRef<HTMLDivElement | null>(null);
    const deliveryRef = useRef<HTMLDivElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useClickOutside({
        ref: wrapperRef,
        onClickOutside: () => setDropdownOpen(false),
    });

    useEffect(() => {
        if (selectedCity) {
            setValue("city", selectedCity.name);
            setValue("area", selectedCity.area ?? "");
            setValue("cityRef", selectedCity.ref);
        }
    }, [selectedCity]);

    useEffect(() => {
        if (selectedWarehouse) {
            setValue("warehouse", selectedWarehouse.description);
            setValue("warehouseRef", selectedWarehouse.ref);
        }
    }, [selectedWarehouse]);

    const { register, control, handleSubmit, setValue, formState: { errors }, setError, clearErrors, watch, reset } = useForm<FormValuesOrder>({
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

    const paymentMethod = watch("paymentMethod");
    const items = watch("items");

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

    const watchedItems = useWatch({ control, name: "items" });

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectProduct = (product: IProduct) => {
        const firstColor = product.colors[0];
        appendItem({
            productId: product.id,
            productColorId: firstColor.id,
            name: product.name,
            color: firstColor.color,
            size: firstColor.sizes[0]?.size ?? "",
            price: product.price,
            quantity: 1,
            imageUrl: firstColor.images[0]?.url ?? "",
        });
        clearErrors("items");
        setSearch("");
        setDropdownOpen(false);
    };

    const totalAmount = watchedItems?.reduce((acc, item) => acc + (item?.price ?? 0) * (item?.quantity ?? 0), 0) ?? 0;

    const onSubmit = async (data: FormValuesOrder) => {
        try {
            console.log(data, selectedWarehouse?.number)
            if (!selectedCity || !selectedWarehouse) {
                toast.error("Введіть місто та виберіть відділення")
                deliveryRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

                return;
            }
            else if (!items.length) {
                toast.error("Додайте товар замовлення")
                deliveryRef.current?.scrollIntoView({
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
                    router.refresh()
                })
                .catch(() => {
                    toast.error("Something went wrong")
                })
            }
        } catch(error: any) {
            toast.error("Помилка створення замовлення", error);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-1 mb-5 group cursor-pointer" onClick={() => router.replace("/manageOrders?tab=AllOrders")}>
                <IoIosArrowBack className="size-5 group" />
                <p className="group-hover:underline group select-none">Повернутися до замовлень</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8 p-4">

                {/* Контактные данные */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold">Контактні дані</h2>
                    <div ref={contactRef}>
                        <ContactForm register={register} errors={errors} control={control}/>
                    </div>
                </div>

                {/* Доставка */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold">Доставка</h2>
                    <div ref={deliveryRef}>
                        <NovaPoshtaSelect
                            selectedCity={selectedCity}
                            setSelectedCity={setSelectedCity}
                            selectedWarehouse={selectedWarehouse}
                            setSelectedWarehouse={setSelectedWarehouse}
                        />
                    </div>
                </div>

                {/* Способ оплаты */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-semibold">Спосіб оплати</h2>
                    <div className="flex gap-4">
                        {(["MONOBANK", "CASH_ON_DELIVERY"] as const).map((method) => (
                            <label key={method} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" value={method} {...register("paymentMethod")} />
                                <span className="">{method === "MONOBANK" ? "Онлайн (Monobank)" : "Накладений платіж"}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Товары */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold">Товари</h2>

                    {/* Поиск и добавление товара */}
                    <div className="relative" ref={wrapperRef}>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setDropdownOpen(true); }}
                            onFocus={() => setDropdownOpen(true)}
                            placeholder="Пошук товару..."
                            className="border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition w-full bg-white"
                        />
                        {dropdownOpen && search && filteredProducts.length > 0 && (
                            <div className="absolute z-10 bottom-full w-full mb-1 bg-gray-200 border-2 border-gray-800 rounded-md mt-1 max-h-100 overflow-auto shadow-md">
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => handleSelectProduct(product)}
                                        className="px-4 py-2 hover:bg-gray-300 cursor-pointer flex items-center gap-3"
                                    >
                                        {product.colors[0]?.images[0]?.url && (
                                            <img src={product.colors[0].images[0].url} className="w-8 h-8 object-cover rounded" alt="" />
                                        )}
                                        <span>{product.name}</span>
                                        <span className="ml-auto text-gray-600">{product.price} грн</span>
                                    </div>
                                ))}
                            </div>
                        )}
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

                        return (
                            <div key={field.id} className="border border-gray-200 bg-white rounded-md p-4 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    {currentItem?.imageUrl && (
                                        <img src={currentItem.imageUrl} className="w-12 h-12 object-cover rounded" alt="" />
                                    )}
                                    <p className="font-medium flex-1">{currentItem?.name}</p>
                                    <ToolTip label="Видалити">
                                        <MdDelete
                                            onClick={() => {
                                                removeItem(index);
                                                if (itemFields.length === 1) {
                                                    setError("items", {
                                                        type: "manual",
                                                        message: "Додайте хоча б один товар",
                                                    });
                                                }
                                            }}
                                            className="size-6 md:size-7 text-gray-500 hover:text-red-600 transition cursor-pointer"
                                        />
                                    </ToolTip>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                                    {/* Цвет */}
                                    <div className="flex flex-col gap-1">
                                        <label className=" text-gray-500">Колір</label>
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
                                                            setValue(`items.${index}.size`, newColor.sizes[0]?.size ?? "");
                                                            setValue(`items.${index}.imageUrl`, newColor.images[0]?.url ?? "");
                                                        }
                                                    }}
                                                    className="border border-gray-200 rounded-sm px-2 py-1.5  outline-none"
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

                                    {/* Размер */}
                                    <div className="flex flex-col gap-1">
                                        <label className=" text-gray-500">Розмір</label>
                                        <select
                                            {...register(`items.${index}.size`)}
                                            className="border border-gray-200 rounded-sm px-2 py-1.5  outline-none"
                                        >
                                            {selectedColor?.sizes.map(s => (
                                                <option key={s.id} value={s.size}>{s.size}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Цена */}
                                    <div className="flex flex-col gap-1">
                                        <label className=" text-gray-500">Ціна (грн)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            {...register(`items.${index}.price`, { valueAsNumber: true })}
                                            className="border border-gray-200 rounded-sm px-2 py-1.5  outline-none"
                                        />
                                    </div>

                                    {/* Количество */}
                                    <div className="flex flex-col gap-1">
                                        <label className=" text-gray-500">Кількість</label>
                                        <input
                                            type="number"
                                            min={1}
                                            {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 1 })}
                                            className="border border-gray-200 rounded-sm px-2 py-1.5  outline-none"
                                        />
                                    </div>

                                </div>
                            </div>
                        );
                    })}

                    {/* Итого */}
                    {itemFields.length > 0 && (
                        <div className="flex justify-start text-base font-semibold">
                            Сума: {paymentMethod === "CASH_ON_DELIVERY" ? "150" : totalAmount} грн
                        </div>
                    )}
                </div>

                <button type="submit" className="bg-black text-white rounded-sm py-3 hover:bg-gray-800 transition">
                    Створити замовлення
                </button>

            </form>
        </div>
    );
};

export default AddOrder;