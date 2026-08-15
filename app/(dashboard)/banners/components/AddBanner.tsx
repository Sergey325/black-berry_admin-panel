"use client";

import {useFieldArray, useForm, useWatch} from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import {useRouter} from "next/navigation";
import {IoIosArrowBack} from "react-icons/io";
import type {IBanner} from "@/app/actions/getBanners";
import type {FormValuesBanner} from "@/app/types";
import ImagesUpload from "@/app/components/ImagesUpload";
import BannerPreview from "@/app/(dashboard)/banners/components/BannerPreview";
import {FiTrash2} from "react-icons/fi";

type Props = {
    banner?: IBanner;
    resetSelectedBanner: () => void;
};

const getDefaultValues = (banner?: IBanner): FormValuesBanner => ({
    image: banner?.image ?? "",
    badge: banner?.badge ?? "",
    title: banner?.title ?? "",
    features: banner?.features.map((value) => ({value})) ?? [],
    ctaHref: banner?.ctaHref ?? "",
    ctaLabel: banner?.ctaLabel ?? "",
    order: banner?.order ?? 0,
});

const getErrorMessage = (error: unknown) => axios.isAxiosError<{ error?: string }>(error)
    ? error.response?.data?.error ?? "Не вдалося зберегти банер"
    : "Не вдалося зберегти банер";

const AddBanner = ({banner, resetSelectedBanner}: Props) => {
    const router = useRouter();
    const {
        register,
        control,
        handleSubmit,
        formState: {errors, isSubmitting},
        setValue,
        reset
    } = useForm<FormValuesBanner>({
        defaultValues: getDefaultValues(banner),
    });
    const {fields, append, remove} = useFieldArray({control, name: "features"});
    const watchedValues = useWatch({control});
    const values: FormValuesBanner = {
        image: watchedValues.image ?? "",
        badge: watchedValues.badge ?? "",
        title: watchedValues.title ?? "",
        features: (watchedValues.features ?? []).map((feature) => ({value: feature?.value ?? ""})),
        ctaHref: watchedValues.ctaHref ?? "",
        ctaLabel: watchedValues.ctaLabel ?? "",
        order: watchedValues.order ?? 0,
    };

    const returnToBanners = () => {
        reset(getDefaultValues());
        resetSelectedBanner();
        router.replace("/banners?tab=AllBanners");
    };

    const onSubmit = async (data: FormValuesBanner) => {
        try {
            await axios.post("/api/banner", {
                ...data,
                id: banner?.id,
                features: data.features.map((feature) => feature.value).filter((feature) => feature.trim()),
            });
            toast.success(banner ? "Банер оновлено!" : "Банер створено!");
            returnToBanners();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div>
            <button type="button" className="group mb-5 inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-gray-950" onClick={returnToBanners}>
                <IoIosArrowBack className="size-5"/>
                <span className="select-none group-hover:underline">Повернутися до банерів</span>
            </button>
            <div className="flex flex-col gap-8">
                <form data-scroll-navigation onSubmit={handleSubmit(onSubmit)}
                      className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Зображення</label>
                        <ImagesUpload
                            value={values.image ? [values.image] : []}
                            onChange={(images) => setValue("image", images[0] ?? "", {shouldValidate: true})}
                            folder="BlackBerry/Banners"
                            maxFiles={1}
                            multiple={false}
                            uploadLabel="Завантажити зображення банера"
                        />
                        <input
                            type="hidden"
                            {...register("image", {required: "Додайте зображення банера"})
                            } />
                        {errors.image && <span className="text-sm text-red-500">{errors.image.message}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Бейдж</label>
                        <input
                            {...register("badge")}
                            placeholder="Наприклад, Нова колекція"
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Заголовок</label>
                        <textarea
                            {...register("title", {required: "Вкажіть заголовок"})}
                            rows={4}
                            placeholder="Переноси рядків буде збережено"
                            className="min-h-28 resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                        />
                        {errors.title && <span className="text-sm text-red-500">{errors.title.message}</span>}
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-base font-semibold text-gray-900">
                                Переваги
                            </h2>
                            <button
                                type="button"
                                onClick={() => append({value: ""})}
                                className="rounded-lg border border-gray-400 px-3 py-1 transition hover:bg-gray-100">
                                Додати
                            </button>
                        </div>
                        {fields.map((field, index) => <div key={field.id} className="flex gap-2">
                            <input {...register(`features.${index}.value`)} placeholder="Текст переваги"
                                   className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"/>
                            <button type="button" aria-label="Видалити перевагу" onClick={() => remove(index)}
                                    className="text-gray-500 transition hover:text-red-600"><FiTrash2
                                className="size-6"/></button>
                        </div>)}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">Текст
                            кнопки</label><input {...register("ctaLabel")}
                                                 className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"/>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">
                                Посилання кнопки
                            </label>
                            <input
                                {...register("ctaHref")}
                                placeholder="/catalog"
                                className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                            />
                        </div>
                    </div>
                    <div className="flex max-w-48 flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">
                            Порядок показу
                        </label>
                        <input
                            type="number"
                            min="0"
                            {...register("order", {
                                valueAsNumber: true,
                                min: {value: 0, message: "Значення не може бути від'ємним"}
                            })}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"/>
                        {errors.order && <span className="text-sm text-red-500">{errors.order.message}</span>}
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-black py-3 text-base font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Збереження..." : banner ? "Оновити банер" : "Зберегти банер"}
                    </button>
                </form>
                <div>
                    <div className="mb-3">
                        <p className="font-semibold text-gray-900">Попередній перегляд</p>
                        <p className="mt-1 text-sm text-gray-500">Так банер виглядатиме на сайті</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm"><BannerPreview banner={values}/></div>
                </div>
            </div>
        </div>
    );
};

export default AddBanner;
