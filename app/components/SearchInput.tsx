"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {FiSearch} from "react-icons/fi";

type Props = {
    placeholder?: string;
};

export default function SearchInput({placeholder = "Пошук за назвою..."}: Props) {
    const router = useRouter();
    const params = useSearchParams();
    const query = params.toString();

    const [value, setValue] = useState(params.get("title") ?? "");

    useEffect(() => {
        const timeout = setTimeout(() => {
            const qs = new URLSearchParams(query);

            if (value) {
                qs.set("title", value);
            } else {
                qs.delete("title");
            }

            router.push(`?${qs.toString()}`);
        }, 400);

        return () => clearTimeout(timeout);
    }, [query, router, value]);

    return (
        <div className="relative w-full sm:max-w-sm">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"/>
        <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
        />
        </div>
    );
}
