import { IMaskInput } from "react-imask";
import {FormValuesOrder} from "@/app/types";
import {Control, Controller, FieldErrors, UseFormRegister} from "react-hook-form";


type Props = {
    register: UseFormRegister<FormValuesOrder>;
    errors: FieldErrors<FormValuesOrder>;
    control:  Control<FormValuesOrder, any, FormValuesOrder>;
};

export default function ContactForm({ register, errors, control }: Props) {
    return (
        <div className="border-2 border-gray-200 rounded-md p-6 flex flex-col gap-5 text-base lg:text-lg bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1">
                    <label className="text-sm md:text-base">Ім&#39;я*</label>
                    <input
                        autoComplete="given-name"
                        maxLength={25}
                        {...register("firstName", {
                            required: "Введіть ім'я",
                            pattern: {
                                value: /^[А-Яа-яІіЇїЄєҐґ' -]+$/,
                                message: "Тільки українські літери",
                            },
                        })}
                        className="border border-gray-200 rounded-sm px-3 py-2 outline-none focus:border-gray-400 transition"
                    />
                    {errors.firstName && (
                        <p className="text-red-500 text-sm">
                            {errors.firstName.message}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm md:text-base">Прізвище*</label>
                    <input
                        autoComplete="family-name"
                        maxLength={25}
                        {...register("lastName", {
                            required: "Введіть прізвище",
                            pattern: {
                                value: /^[А-Яа-яІіЇїЄєҐґ' -]+$/,
                                message: "Тільки українські літери",
                            },
                        })}
                        className="border border-gray-200 rounded-sm px-3 py-2 outline-none focus:border-gray-400 transition"
                    />
                    {errors.lastName && (
                        <p className="text-red-500 text-sm">
                            {errors.lastName.message}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm md:text-base">Номер телефону*</label>
                    <Controller
                        control={control}
                        name="phone"
                        rules={{
                            required: "Введіть номер телефону",
                            validate: (value) =>
                                value.length === 19 || "Невірний номер телефону",
                        }}
                        render={({ field }) => (
                            <IMaskInput
                                mask="+38 (000) 000-00-00"
                                autoComplete="tel"
                                value={field.value || ""}
                                onAccept={(value) => field.onChange(value)}
                                className="border border-gray-200 rounded-sm px-3 py-2 outline-none focus:border-gray-400 transition"
                            />
                        )}
                    />
                    {errors.phone && (
                        <p className="text-red-500 text-sm">
                            {errors.phone.message}
                        </p>
                    )}
                </div>
                {/* Email */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm md:text-base">
                        Email
                    </label>

                    <input
                        type="email"
                        autoComplete="email"
                        maxLength={50}
                        {...register("email", {
                            pattern: {
                                value: /^\S+@\S+\.\S+$/,
                                message: "Невірний email",
                            },
                        })}
                        className="border border-gray-200 rounded-sm px-3 py-2 outline-none focus:border-gray-400 transition"
                    />

                    {errors.email && (
                        <p className="text-red-500 text-sm">
                            {errors.email.message}
                        </p>
                    )}
                </div>

            </div>


            {/* Комментарий */}
            <div className="flex flex-col gap-1">
                <label className="text-sm md:text-base">
                    Коментарі до замовлення
                </label>

                <textarea
                    rows={4}
                    maxLength={500}
                    {...register("comment")}
                    className="border border-gray-200 rounded-sm px-3 py-2 outline-none focus:border-gray-400 transition min-h-20 max-h-70"
                />

            </div>

        </div>
    );
}