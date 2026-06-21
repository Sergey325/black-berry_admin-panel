"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchInput() {
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
            placeholder="Пошук за назвою..."
            className="border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400 transition w-full sm:w-64"
        />
    );
}