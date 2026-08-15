"use client";

import {useMemo} from "react";
import {Controller, useForm, useWatch} from "react-hook-form";
import {IMaskInput} from "react-imask";
import axios from "axios";
import toast from "react-hot-toast";
import {IoIosArrowBack} from "react-icons/io";
import type {PromoScope, PromoSelectOption} from "@/app/actions/getPromoCodes";
import Dropdown from "@/app/components/DropDown";
import SearchSelect from "@/app/components/SearchSelect";
import CheckBox from "@/app/components/CheckBox";
import {PromoCodeDetails, PromoCodeFormValues} from "@/app/types";



interface Props {
    promoCode?: PromoCodeDetails;
    categories: PromoSelectOption[];
    products: PromoSelectOption[];
    onBack: () => void;
}

const scopeOptions = [
    {value: "ALL" as const, label: "Весь каталог"},
    {value: "CATEGORY" as const, label: "Категорії"},
    {value: "PRODUCT" as const, label: "Товари"},
];

const dateTimeError = "Вкажіть дату у форматі ДД.ММ.РРРР ГГ:ХХ";

const parseDateTime = (value: string) => {
    const match = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/.exec(value);
    if (!match) return null;

    const [, dayValue, monthValue, yearValue, hourValue, minuteValue] = match;
    const day = Number(dayValue);
    const month = Number(monthValue);
    const year = Number(yearValue);
    const hour = Number(hourValue);
    const minute = Number(minuteValue);
    const date = new Date(year, month - 1, day, hour, minute);

    return date.getFullYear() === year
        && date.getMonth() === month - 1
        && date.getDate() === day
        && date.getHours() === hour
        && date.getMinutes() === minute
        ? date
        : null;
};

const toDateTimeInput = (value: string | null | undefined) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (part: number) => String(part).padStart(2, "0");
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getDefaultValues = (promoCode?: PromoCodeDetails): PromoCodeFormValues => ({
    code: promoCode?.code ?? "",
    discountPercent: promoCode?.discountPercent ?? 1,
    scopeType: promoCode?.scopeType ?? "ALL",
    categoryIds: promoCode?.categories.map((category) => category.id) ?? [],
    productIds: promoCode?.products.map((product) => product.id) ?? [],
    startsAt: toDateTimeInput(promoCode?.startsAt),
    expiresAt: toDateTimeInput(promoCode?.expiresAt),
    maxUses: promoCode?.maxUses ?? null,
    isActive: promoCode?.isActive ?? true,
});

const getErrorMessage = (error: unknown) => axios.isAxiosError<{error?: string}>(error)
    ? error.response?.data?.error ?? "Не вдалося зберегти промокод"
    : "Не вдалося зберегти промокод";

const PromoCodeForm = ({promoCode, categories, products, onBack}: Props) => {
    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
        setValue,
        getValues,
        clearErrors,
        control,
    } = useForm<PromoCodeFormValues>({defaultValues: getDefaultValues(promoCode)});
    const [scopeType, categoryIds, productIds] = useWatch({
        control,
        name: ["scopeType", "categoryIds", "productIds"],
    });
    const selectedCategories = useMemo(
        () => categories.filter((category) => categoryIds.includes(category.id)),
        [categories, categoryIds],
    );
    const selectedProducts = useMemo(
        () => products.filter((product) => productIds.includes(product.id)),
        [productIds, products],
    );

    const changeScope = (scope: PromoScope) => {
        setValue("scopeType", scope, {shouldValidate: true});
        setValue("categoryIds", [], {shouldValidate: true});
        setValue("productIds", [], {shouldValidate: true});
        clearErrors(["categoryIds", "productIds"]);
    };

    const onSubmit = async (data: PromoCodeFormValues) => {
        const payload = {
            ...data,
            code: data.code.trim().toUpperCase(),
            startsAt: parseDateTime(data.startsAt)?.toISOString() ?? null,
            expiresAt: parseDateTime(data.expiresAt)?.toISOString() ?? null,
        };

        try {
            if (promoCode) {
                await axios.patch(`/api/promo-codes/${promoCode.id}`, payload);
            } else {
                await axios.post("/api/promo-codes", payload);
            }
            toast.success(promoCode ? "Промокод оновлено!" : "Промокод створено!");
            onBack();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div>
            <button type="button" className="group mb-5 flex items-center gap-1" onClick={onBack}>
                <IoIosArrowBack className="size-5"/>
                <span className="select-none group-hover:underline">Повернутися до промокодів</span>
            </button>
            <form data-scroll-navigation onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 rounded-xl border border-gray-300 bg-white p-3 md:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-base font-medium md:text-lg">Код</label>
                        <input
                            {...register("code", {
                                required: "Вкажіть код",
                                validate: (value) => Boolean(value.trim()) || "Вкажіть код",
                            })}
                            onInput={(event) => {
                                event.currentTarget.value = event.currentTarget.value.toUpperCase();
                            }}
                            autoComplete="off"
                            className="rounded-lg border border-gray-300 px-3 py-2 uppercase tracking-wide outline-none transition focus:border-gray-600 md:text-lg"
                        />
                        {errors.code && <span className="text-sm text-red-500">{errors.code.message}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-base font-medium md:text-lg">Знижка, %</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            step="0.01"
                            {...register("discountPercent", {
                                valueAsNumber: true,
                                required: "Вкажіть знижку",
                                min: {value: 1, message: "Мінімальне значення — 1"},
                                max: {value: 100, message: "Максимальне значення — 100"},
                            })}
                            className="rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-600 md:text-lg"
                        />
                        {errors.discountPercent && <span className="text-sm text-red-500">{errors.discountPercent.message}</span>}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <Dropdown<PromoScope>
                        label="Область дії"
                        options={scopeOptions}
                        value={scopeType}
                        onChange={(option) => changeScope(option.value)}
                    />
                    <input type="hidden" {...register("scopeType")}/>
                </div>

                {scopeType === "CATEGORY" && (
                    <div className="flex flex-col gap-2">
                        <label className="font-medium">Категорії</label>
                        <SearchSelect
                            multiple
                            options={categories}
                            value={selectedCategories}
                            onChange={(selected) => {
                                setValue("categoryIds", selected.map((option) => option.id), {shouldValidate: true});
                                clearErrors("categoryIds");
                            }}
                            showImages
                            placeholder="Пошук категорії..."
                            error={errors.categoryIds?.message}
                        />
                        <input
                            type="hidden"
                            {...register("categoryIds", {
                                validate: (ids) => getValues("scopeType") !== "CATEGORY" || ids.length > 0 || "Виберіть хоча б одну категорію",
                            })}
                        />
                    </div>
                )}

                {scopeType === "PRODUCT" && (
                    <div className="flex flex-col gap-2">
                        <label className="font-medium">Товари</label>
                        <SearchSelect
                            multiple
                            options={products}
                            value={selectedProducts}
                            onChange={(selected) => {
                                setValue("productIds", selected.map((option) => option.id), {shouldValidate: true});
                                clearErrors("productIds");
                            }}
                            showImages
                            placeholder="Пошук товару..."
                            error={errors.productIds?.message}
                        />
                        <input
                            type="hidden"
                            {...register("productIds", {
                                validate: (ids) => getValues("scopeType") !== "PRODUCT" || ids.length > 0 || "Виберіть хоча б один товар",
                            })}
                        />
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label className="font-medium">Початок дії</label>
                        <Controller
                            control={control}
                            name="startsAt"
                            rules={{
                                validate: (value) => !value || parseDateTime(value) !== null || dateTimeError,
                            }}
                            render={({field}) => (
                                <IMaskInput
                                    mask="00.00.0000 00:00"
                                    value={field.value}
                                    onAccept={(value) => field.onChange(value)}
                                    onBlur={field.onBlur}
                                    inputRef={field.ref}
                                    inputMode="numeric"
                                    placeholder="ДД.ММ.РРРР ГГ:ХХ"
                                    className="rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-600"
                                />
                            )}
                        />
                        {errors.startsAt
                            ? <span className="text-sm text-red-500">{errors.startsAt.message}</span>
                            : <span className="text-xs text-gray-500">Не вказано — діє одразу</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="font-medium">Завершення дії</label>
                        <Controller
                            control={control}
                            name="expiresAt"
                            rules={{
                                validate: (value) => {
                                    if (!value) return true;
                                    const expiresAt = parseDateTime(value);
                                    if (!expiresAt) return dateTimeError;
                                    const startsAt = parseDateTime(getValues("startsAt"));
                                    return !startsAt || expiresAt > startsAt || "Дата завершення має бути пізнішою за дату початку";
                                },
                            }}
                            render={({field}) => (
                                <IMaskInput
                                    mask="00.00.0000 00:00"
                                    value={field.value}
                                    onAccept={(value) => field.onChange(value)}
                                    onBlur={field.onBlur}
                                    inputRef={field.ref}
                                    inputMode="numeric"
                                    placeholder="ДД.ММ.РРРР ГГ:ХХ"
                                    className="rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-600"
                                />
                            )}
                        />
                        {errors.expiresAt
                            ? <span className="text-sm text-red-500">{errors.expiresAt.message}</span>
                            : <span className="text-xs text-gray-500">Не вказано — без кінцевої дати</span>}
                    </div>
                </div>

                <div className="flex max-w-sm flex-col gap-1">
                    <label className="font-medium">Ліміт використань</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        {...register("maxUses", {
                            setValueAs: (value: string) => value === "" ? null : Number(value),
                            validate: (value) => value === null || (Number.isInteger(value) && value > 0) || "Вкажіть додатне ціле число",
                        })}
                        className="rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-600"
                    />
                    {errors.maxUses && <span className="text-sm text-red-500">{errors.maxUses.message}</span>}
                    <span className="text-xs text-gray-500">Порожнє поле для необмеженого використання</span>
                </div>

                {promoCode && (
                    <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        Використано {promoCode.usedCount} разів
                    </div>
                )}

                <Controller
                    control={control}
                    name="isActive"
                    render={({field}) => (
                        <CheckBox
                            label="Активний"
                            checked={field.value}
                            onChange={field.onChange}
                            colorOnChecked="text-gray-950"
                            labelStyle="font-medium"
                        />
                    )}
                />

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-black py-3 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? "Збереження..." : promoCode ? "Оновити промокод" : "Зберегти промокод"}
                </button>
            </form>
        </div>
    );
};

export default PromoCodeForm;
