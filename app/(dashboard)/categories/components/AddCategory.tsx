import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import axios from "axios";
import { IoIosArrowBack } from "react-icons/io";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ICategory } from "@/app/actions/getCategories";
import { FormValuesCategory } from "@/app/types";
import CheckBox from "@/app/components/CheckBox";
import slugify from "@/app/utils/slugify";
import ImagesUpload from "@/app/components/ImagesUpload";
import Dropdown from "@/app/components/DropDown";
import {FiTrash2} from "react-icons/fi";

type Props = {
    category?: ICategory;
    resetSelectedCategory: () => void;
}

const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError<{ error?: string }>(error)) {
        return error.response?.data?.error ?? fallback;
    }

    return fallback;
};

const getDefaultValues = (category?: ICategory): FormValuesCategory => ({
    name: category?.name ?? "",
    coverImage: category?.coverImage ?? "",
    sizeGuideImage: category?.sizeGuideImage ?? "",
    season: category?.season ?? "ALL_SEASON",
    productsDescription: category?.productsDescription ?? "",
    description: category?.description ?? "",
    isOnMainPage: category?.isOnMainPage ?? false,
    isDecoration: category?.isDecoration ?? false,
    defaultSizes: category?.defaultSizes ?? [],
    specifications: category?.specifications.map(({ name, value }) => ({ name, value })) ?? [],
});

const AddCategory = ({ category, resetSelectedCategory}: Props) => {
    const router = useRouter();
    const { register, control, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormValuesCategory>({
        defaultValues: getDefaultValues(category),
    });
    const { fields: specificationFields, append, remove } = useFieldArray({
        control,
        name: "specifications",
    });
    const [coverImage, sizeGuideImage, season, defaultSizes] = useWatch({
        control,
        name: ["coverImage", "sizeGuideImage", "season", "defaultSizes"],
    });

    const addDefaultSize = () => {
        setValue("defaultSizes", [...defaultSizes, ""], { shouldDirty: true });
    };

    const updateDefaultSize = (index: number, value: string) => {
        setValue("defaultSizes", defaultSizes.map((size, sizeIndex) => sizeIndex === index ? value : size), {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    const removeDefaultSize = (index: number) => {
        setValue("defaultSizes", defaultSizes.filter((_, sizeIndex) => sizeIndex !== index), {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    const onSubmit = async (data: FormValuesCategory) => {
        try {
            await axios.post("/api/category", {
                ...data,
                id: category?.id,
                slug: slugify(data.name),
            });

            toast.success(category ? "Категорію оновлено!" : "Категорію створено!");
            returnToCategories()
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Не вдалося зберегти категорію"));
        }
    };

    const returnToCategories = () => {
        reset(getDefaultValues());
        resetSelectedCategory();
        router.replace("/categories?tab=AllCategories");
    };

    const seasonOptions = [
        {
            value: "SUMMER",
            label: "Літній",
            onClick: () => setValue("season", "SUMMER", { shouldValidate: true }),
        },
        {
            value: "WINTER",
            label: "Зимовий",
            onClick: () => setValue("season", "WINTER", { shouldValidate: true }),
        },
        {
            value: "ALL_SEASON",
            label: "Всесезонний",
            onClick: () => setValue("season", "ALL_SEASON", { shouldValidate: true }),
        },
    ];

    return (
        <div>
            <button type="button" className="group mb-5 inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-gray-950" onClick={returnToCategories}>
                <IoIosArrowBack className="size-5" />
                <span className="select-none">Повернутися до категорій</span>
            </button>

            <form data-scroll-navigation onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Назва категорії</label>
                    <input
                        {...register("name", { required: "Обов'язкове поле" })}
                        className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                    />
                    {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
                </div>

                <div className="flex flex-col sm:flex-row gap-7">
                    <div className="w-full flex flex-col gap-2 ">
                        <label className="text-sm font-medium text-gray-700">Обкладинка категорії</label>
                        <ImagesUpload
                            value={coverImage ? [coverImage] : []}
                            onChange={(images) => setValue("coverImage", images[0] ?? "", { shouldValidate: true })}
                            folder="BlackBerry/Categories"
                            maxFiles={1}
                            multiple={false}
                            uploadLabel="Завантажити обкладинку"
                        />
                        <input type="hidden" {...register("coverImage", { required: "Додайте обкладинку категорії" })} />
                        {errors.coverImage && <span className="text-sm text-red-500">{errors.coverImage.message}</span>}
                    </div>

                    <div className="w-full flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Таблиця розмірів</label>
                        <ImagesUpload
                            value={sizeGuideImage ? [sizeGuideImage] : []}
                            onChange={(images) => setValue("sizeGuideImage", images[0] ?? "", { shouldDirty: true })}
                            folder="BlackBerry/Categories/SizeGuides"
                            maxFiles={1}
                            multiple={false}
                            uploadLabel="Завантажити таблицю розмірів"
                        />
                        <input type="hidden" {...register("sizeGuideImage")} />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Сезон</label>
                    <Dropdown options={seasonOptions} value={season}/>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Опис товарів категорії</label>
                    <textarea {...register("productsDescription", { required: "Обов'язкове поле" })} rows={5} className="max-h-[240px] min-h-28 overflow-y-auto rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200" />
                    {errors.productsDescription && <span className="text-sm text-red-500">{errors.productsDescription.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Опис категорії</label>
                    <textarea {...register("description", { required: "Обов'язкове поле" })} rows={5} className="max-h-[240px] min-h-28 overflow-y-auto rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200" />
                    {errors.description && <span className="text-sm text-red-500">{errors.description.message}</span>}
                </div>
                <div className="flex flex-wrap gap-5">
                    <Controller
                        control={control}
                        name="isOnMainPage"
                        render={({field}) => (
                            <CheckBox label="На головній" checked={field.value} onChange={field.onChange}/>
                        )}
                    />
                    <Controller
                        control={control}
                        name="isDecoration"
                        render={({field}) => (
                            <CheckBox label="Декорація" checked={field.value} onChange={field.onChange}/>
                        )}
                    />
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-gray-900">Розміри за замовчуванням</h2>
                        <button type="button" onClick={addDefaultSize} className="border border-gray-400 rounded-lg px-3 py-1 hover:bg-gray-100 transition">Додати</button>
                    </div>
                    {defaultSizes.map((size, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <input
                                value={size}
                                onChange={(event) => updateDefaultSize(index, event.target.value)}
                                placeholder="Розмір"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-600"
                            />
                            <button type="button" onClick={() => removeDefaultSize(index)} className="pt-2 text-gray-500 hover:text-red-600 transition" aria-label="Видалити розмір"><FiTrash2 className="size-6" /></button>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-gray-900">Характеристики</h2>
                        <button type="button" onClick={() => append({ name: "", value: "" })} className="border border-gray-400 rounded-lg px-3 py-1 hover:bg-gray-100 transition">Додати</button>
                    </div>
                    {specificationFields.map((field, index) => (
                        <div key={field.id}>
                            <div className="flex gap-2 items-start">
                                <input {...register(`specifications.${index}.name`, { required: "Вкажіть назву" })} placeholder="Назва" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-600 transition" />
                                <input {...register(`specifications.${index}.value`, { required: "Вкажіть значення" })} placeholder="Значення" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-gray-600 transition" />
                                <button type="button" onClick={() => remove(index)} className="pt-2 text-gray-500 hover:text-red-600 transition" aria-label="Видалити характеристику"><FiTrash2 className="size-6" /></button>
                            </div>
                            {(errors.specifications?.[index]?.name?.message || errors.specifications?.[index]?.value?.message) && (
                                <p className="mt-1 text-red-500">{errors.specifications?.[index]?.name?.message ?? errors.specifications?.[index]?.value?.message}</p>
                            )}
                        </div>
                    ))}
                </div>

                <button type="submit" className="rounded-lg bg-black py-3 text-base font-medium text-white transition hover:bg-gray-800">
                    {category ? "Оновити категорію" : "Зберегти категорію"}
                </button>
            </form>
        </div>
    );
};

export default AddCategory;
