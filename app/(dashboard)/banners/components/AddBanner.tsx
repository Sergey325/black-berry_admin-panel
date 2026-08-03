"use client";

import {useFieldArray, useForm} from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import {useRouter} from "next/navigation";
import {IoIosArrowBack} from "react-icons/io";
import type {IBanner} from "@/app/actions/getBanners";
import type {FormValuesBanner} from "@/app/types";
import ImagesUpload from "@/app/(dashboard)/products/components/ImagesUpload";
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
        watch,
        reset
    } = useForm<FormValuesBanner>({
        defaultValues: getDefaultValues(banner),
    });
    const {fields, append, remove} = useFieldArray({control, name: "features"});
    const values = watch();

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
            router.refresh();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div>
            <button type="button" className="group mb-5 flex items-center gap-1" onClick={returnToBanners}>
                <IoIosArrowBack className="size-5"/>
                <span className="select-none group-hover:underline">Повернутися до банерів</span>
            </button>
            <div className="flex flex-col gap-8">
                <form onSubmit={handleSubmit(onSubmit)}
                      className="flex flex-col gap-6 rounded-xl border border-gray-300 bg-white p-3 md:p-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-base font-medium md:text-lg">Зображення</label>
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
                        {errors.image && <span className="text-red-500">{errors.image.message}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-base font-medium md:text-lg">Бейдж</label>
                        <input
                            {...register("badge")}
                            placeholder="Наприклад, Нова колекція"
                            className="rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-600 md:text-lg"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-base font-medium md:text-lg">Заголовок</label>
                        <textarea
                            {...register("title", {required: "Вкажіть заголовок"})}
                            rows={4}
                            placeholder="Переноси рядків буде збережено"
                            className="min-h-24 resize-y rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-600 md:text-lg"
                        />
                        {errors.title && <span className="text-red-500">{errors.title.message}</span>}
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-medium">
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
                                   className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-600"/>
                            <button type="button" aria-label="Видалити перевагу" onClick={() => remove(index)}
                                    className="text-gray-500 transition hover:text-red-600"><FiTrash2
                                className="size-6"/></button>
                        </div>)}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1"><label className="font-medium">Текст
                            кнопки</label><input {...register("ctaLabel")}
                                                 className="rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-600"/>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-medium">
                                Посилання кнопки
                            </label>
                            <input
                                {...register("ctaHref")}
                                placeholder="/catalog"
                                className="rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-600"
                            />
                        </div>
                    </div>
                    <div className="flex max-w-48 flex-col gap-1">
                        <label className="font-medium">
                            Порядок показу
                        </label>
                        <input
                            type="number"
                            min="0"
                            {...register("order", {
                                valueAsNumber: true,
                                min: {value: 0, message: "Значення не може бути від'ємним"}
                            })}
                            className="rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-600"/>
                        {errors.order && <span className="text-red-500">{errors.order.message}</span>}
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-black py-3 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Збереження..." : banner ? "Оновити банер" : "Зберегти банер"}
                    </button>
                </form>
                <div>
                    <p className="mb-3 text-lg font-medium">
                        Попередній перегляд
                    </p>
                    <BannerPreview banner={values}/>
                </div>
            </div>
        </div>
    );
};

export default AddBanner;
