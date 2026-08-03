"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
    placeholder?: string;
};

export default function SearchInput({placeholder = "Пошук за назвою..."}: Props) {
    const router = useRouter();
    const params = useSearchParams();

    const [value, setValue] = useState(params.get("title") ?? "");

    useEffect(() => {
        const timeout = setTimeout(() => {
            const qs = new URLSearchParams(params);

            if (value) {
                qs.set("title", value);
            } else {
                qs.delete("title");
            }

            router.push(`?${qs.toString()}`);
        }, 400);

        return () => clearTimeout(timeout);
    }, [value]);

    return (
        <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 transition w-full sm:w-64 bg-white"
        />
    );
}
