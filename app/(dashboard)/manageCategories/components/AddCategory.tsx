import { useFieldArray, useForm } from "react-hook-form";
import axios from "axios";
import { IoIosArrowBack } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ICategory } from "@/app/actions/getCategories";
import { FormValuesCategory } from "@/app/types";
import Dropdown from "@/app/components/DropDown";
import CheckBox from "@/app/components/CheckBox";
import slugify from "@/app/utils/slugify";
import ImagesUpload from "@/app/(dashboard)/manageProducts/components/ImagesUpload";

type Props = {
    category?: ICategory;
    resetSelectedCategory: () => void;
}

const seasonOptions = [
    { value: "SUMMER", label: "Літній" },
    { value: "WINTER", label: "Зимовий" },
    { value: "ALL_SEASON", label: "Всесезонний" },
] as const;

const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError<{ error?: string }>(error)) {
        return error.response?.data?.error ?? fallback;
    }

    return fallback;
};

const getDefaultValues = (category?: ICategory): FormValuesCategory => ({
    name: category?.name ?? "",
    coverImage: category?.coverImage ?? "",
    season: category?.season ?? "ALL_SEASON",
    productsDescription: category?.productsDescription ?? "",
    description: category?.description ?? "",
    isOnMainPage: category?.isOnMainPage ?? false,
    hasLining: category?.hasLining ?? false,
    isDecoration: category?.isDecoration ?? false,
    specifications: category?.specifications.map(({ name, value }) => ({ name, value })) ?? [],
});

const AddCategory = ({ category, resetSelectedCategory}: Props) => {
    const router = useRouter();
    const { register, control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormValuesCategory>({
        defaultValues: getDefaultValues(category),
    });
    const { fields: specificationFields, append, remove } = useFieldArray({
        control,
        name: "specifications",
    });
    const coverImage = watch("coverImage");
    const season = watch("season");

    const onSubmit = async (data: FormValuesCategory) => {
        try {
            await axios.post("/api/category", {
                ...data,
                id: category?.id,
                slug: slugify(data.name),
            });

            toast.success(category ? "Категорію оновлено!" : "Категорію створено!");
            reset(getDefaultValues());
            resetSelectedCategory();
            router.replace("/manageCategories?tab=AllCategories");
            router.refresh();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Не вдалося зберегти категорію"));
        }
    };

    const returnToCategories = () => {
        reset(getDefaultValues());
        resetSelectedCategory();
        router.replace("/manageCategories?tab=AllCategories");
    };

    return (
        <div>
            <div className="flex items-center gap-1 mb-5 group cursor-pointer" onClick={returnToCategories}>
                <IoIosArrowBack className="size-5" />
                <p className="group-hover:underline select-none">Повернутися до категорій</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 bg-white rounded-md p-3 border border-gray-300 md:p-5">
                <div className="flex flex-col gap-1">
                    <label className="text-base md:text-lg font-medium">Назва категорії</label>
                    <input
                        {...register("name", { required: "Обов'язкове поле" })}
                        className="border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition md:text-lg"
                    />
                    {errors.name && <span className="text-red-500 text-base md:text-lg">{errors.name.message}</span>}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-base md:text-lg font-medium">Обкладинка категорії</label>
                    <ImagesUpload
                        value={coverImage ? [coverImage] : []}
                        onChange={(images) => setValue("coverImage", images[0] ?? "", { shouldValidate: true })}
                        folder="BlackBerry/Categories"
                        maxFiles={1}
                        multiple={false}
                        uploadLabel="Завантажити обкладинку"
                    />
                    <input type="hidden" {...register("coverImage", { required: "Додайте обкладинку категорії" })} />
                    {errors.coverImage && <span className="text-red-500 text-base md:text-lg">{errors.coverImage.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-base md:text-lg font-medium">Сезон</label>
                    <Dropdown
                        options={[...seasonOptions]}
                        value={season}
                        onChange={(option) => setValue("season", option.value, { shouldValidate: true })}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-base md:text-lg font-medium">Опис товарів категорії</label>
                    <textarea {...register("productsDescription", { required: "Обов'язкове поле" })} rows={5} className="border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition max-h-[200px] min-h-[45px] overflow-y-auto md:text-lg" />
                    {errors.productsDescription && <span className="text-red-500 text-base md:text-lg">{errors.productsDescription.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-base md:text-lg font-medium">Опис категорії</label>
                    <textarea {...register("description", { required: "Обов'язкове поле" })} rows={5} className="border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition max-h-[200px] min-h-[45px] overflow-y-auto md:text-lg" />
                    {errors.description && <span className="text-red-500 text-base md:text-lg">{errors.description.message}</span>}
                </div>
                <div className="flex flex-wrap gap-5">
                    <CheckBox label="На головній" initialValue={category?.isOnMainPage ?? false} onChange={(value) => setValue("isOnMainPage", value)} />
                    <CheckBox label="Підкладка" initialValue={category?.hasLining ?? false} onChange={(value) => setValue("hasLining", value)} />
                    <CheckBox label="Декорація" initialValue={category?.isDecoration ?? false} onChange={(value) => setValue("isDecoration", value)} />
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-medium">Характеристики</h2>
                        <button type="button" onClick={() => append({ name: "", value: "" })} className="border border-gray-400 rounded-sm px-3 py-1 hover:bg-gray-100 transition">Додати</button>
                    </div>
                    {specificationFields.map((field, index) => (
                        <div key={field.id}>
                            <div className="flex gap-2 items-start">
                                <input {...register(`specifications.${index}.name`, { required: "Вкажіть назву" })} placeholder="Назва" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition" />
                                <input {...register(`specifications.${index}.value`, { required: "Вкажіть значення" })} placeholder="Значення" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition" />
                                <button type="button" onClick={() => remove(index)} className="pt-2 text-gray-500 hover:text-red-600 transition" aria-label="Видалити характеристику"><MdDelete className="size-6" /></button>
                            </div>
                            {(errors.specifications?.[index]?.name?.message || errors.specifications?.[index]?.value?.message) && (
                                <p className="mt-1 text-red-500">{errors.specifications?.[index]?.name?.message ?? errors.specifications?.[index]?.value?.message}</p>
                            )}
                        </div>
                    ))}
                </div>

                <button type="submit" className="bg-black text-white rounded-sm py-3 hover:bg-gray-800 transition">
                    {category ? "Оновити категорію" : "Зберегти категорію"}
                </button>
            </form>
        </div>
    );
};

export default AddCategory;
