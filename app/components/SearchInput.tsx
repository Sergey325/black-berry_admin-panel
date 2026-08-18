"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {ChangeEvent, useEffect, useState, useTransition} from "react";
import {FiSearch} from "react-icons/fi";
import {AiOutlineLoading} from "react-icons/ai";

type Props = {
    placeholder?: string;
    searchParam?: string;
};

export default function SearchInput({placeholder = "Пошук за назвою...", searchParam = "title"}: Props) {
    const router = useRouter();
    const params = useSearchParams();
    const query = params.toString();

    const [value, setValue] = useState(params.get(searchParam) ?? "");
    const [isDebouncing, setIsDebouncing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const isSearching = isDebouncing || isPending;

    useEffect(() => {
        const timeout = setTimeout(() => {
            const qs = new URLSearchParams(query);

            if (value) {
                qs.set(searchParam, value);
            } else {
                qs.delete(searchParam);
            }

            setIsDebouncing(false);

            if (qs.toString() === query) return;

            startTransition(() => {
                router.push(`?${qs.toString()}`);
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [query, router, searchParam, value]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
        setIsDebouncing(true);
    };

    return (
        <div className="relative w-full sm:max-w-sm">
            {isSearching
                ? <AiOutlineLoading className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary-dark"/>
                : <FiSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"/>
            }
        <input
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-busy={isSearching}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            />
        </div>
    );
}
