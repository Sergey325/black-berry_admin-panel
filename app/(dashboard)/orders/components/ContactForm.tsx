import { IMaskInput } from "react-imask";
import {FormValuesOrder} from "@/app/types";
import {Control, Controller, FieldErrors, UseFormRegister} from "react-hook-form";


type Props = {
    register: UseFormRegister<FormValuesOrder>;
    errors: FieldErrors<FormValuesOrder>;
    control: Control<FormValuesOrder>;
};

export default function ContactForm({ register, errors, control }: Props) {
    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                    <label className="text-base font-medium text-gray-700">Ім&#39;я*</label>
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
                        className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                    />
                    {errors.firstName && (
                        <p className="text-red-500 text-sm">
                            {errors.firstName.message}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-base font-medium text-gray-700">Прізвище*</label>
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
                        className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                    />
                    {errors.lastName && (
                        <p className="text-red-500 text-sm">
                            {errors.lastName.message}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-base font-medium text-gray-700">Номер телефону*</label>
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
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                            />
                        )}
                    />
                    {errors.phone && (
                        <p className="text-red-500 text-sm">
                            {errors.phone.message}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-base font-medium text-gray-700">
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
                        className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                    />

                    {errors.email && (
                        <p className="text-red-500 text-sm">
                            {errors.email.message}
                        </p>
                    )}
                </div>

            </div>


            <div className="flex flex-col gap-1">
                <label className="text-base font-medium text-gray-700">
                    Коментарі до замовлення
                </label>

                <textarea
                    rows={4}
                    maxLength={500}
                    {...register("comment")}
                    className="min-h-24 max-h-70 rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                />

            </div>

        </div>
    );
}
