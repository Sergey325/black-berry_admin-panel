"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
    { value: "newest", label: "Спочатку нові" },
    { value: "oldest", label: "Спочатку старі" },
    { value: "price_asc", label: "Ціна: за зростанням" },
    { value: "price_desc", label: "Ціна: за спаданням" },
    { value: "name_asc", label: "Назва: А-Я" },
    { value: "name_desc", label: "Назва: Я-А" },
];

export default function SortDropdown() {
    const router = useRouter();
    const params = useSearchParams();

    const currentSort = params.get("sort") ?? "newest";

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const qs = new URLSearchParams(params);
        qs.set("sort", e.target.value);
        router.push(`?${qs.toString()}`);
    };

    return (
        <select
            value={currentSort}
            onChange={handleChange}
            className="border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400 transition bg-white w-full"
        >
            {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}