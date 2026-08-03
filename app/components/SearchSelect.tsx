"use client";

import {useDeferredValue, useMemo, useRef, useState} from "react";
import Image from "next/image";
import {FiX} from "react-icons/fi";
import useClickOutside from "@/app/hooks/useClickOutside";

export interface SearchSelectOption {
    id: number;
    label: string;
    imageUrl?: string;
    description?: string;
}

interface SearchSelectProps {
    options: SearchSelectOption[];
    value: SearchSelectOption[];
    onChange: (options: SearchSelectOption[]) => void;
    multiple?: boolean;
    placeholder: string;
    emptyText?: string;
    error?: string;
    showImages?: boolean;
    imageFit?: "cover" | "contain";
}

const SearchSelect = ({
    options,
    value,
    onChange,
    multiple = false,
    placeholder,
    emptyText = "Нічого не знайдено",
    error,
    showImages = false,
    imageFit = "cover",
}: SearchSelectProps) => {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const deferredSearch = useDeferredValue(search.trim().toLowerCase());
    const rootRef = useRef<HTMLDivElement>(null);
    const selectedIds = useMemo(() => new Set(value.map((option) => option.id)), [value]);

    useClickOutside({ref: rootRef, onClickOutside: () => setIsOpen(false)});

    const filteredOptions = useMemo(() => options.filter((option) => (
        !selectedIds.has(option.id) && option.label.toLowerCase().includes(deferredSearch)
    )), [deferredSearch, options, selectedIds]);

    const selectOption = (option: SearchSelectOption) => {
        onChange(multiple ? [...value, option] : [option]);
        setSearch("");
        setIsOpen(false);
    };

    const removeOption = (id: number) => onChange(value.filter((option) => option.id !== id));

    return (
        <div ref={rootRef} className="relative bg-white">
            <input
                type="search"
                value={search}
                onChange={(event) => {
                    setSearch(event.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className={`w-full rounded-lg border px-3 py-2 outline-none transition focus:border-gray-600 ${error ? "border-red-400" : "border-gray-300"}`}
            />
            {isOpen && (
                <div className="absolute top-full z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-300 bg-white p-1 shadow-lg">
                    {filteredOptions.length === 0
                        ? <p className="px-3 py-2 text-sm text-gray-400">{emptyText}</p>
                        : filteredOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => selectOption(option)}
                                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-gray-100"
                            >
                                {showImages && (
                                    <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-gray-50 border border-gray-300">
                                        {option.imageUrl && (
                                            <Image
                                                src={option.imageUrl}
                                                alt=""
                                                fill
                                                sizes="40px"
                                                className={`${imageFit === "contain" ? "object-contain" : "object-cover"} object-top-right`}
                                            />
                                        )}
                                    </span>
                                )}
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate">{option.label}</span>
                                    {option.description && (
                                        <span className="block truncate text-xs text-gray-500">{option.description}</span>
                                    )}
                                </span>
                            </button>
                        ))}
                </div>
            )}
            {value.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {value.map((option) => (
                        <span key={option.id} className="flex max-w-full items-center gap-2 rounded-full bg-gray-100 py-1 pr-2 pl-1 text-sm text-gray-700">
                            {showImages && (
                                <span className="relative size-7 shrink-0 overflow-hidden rounded-full bg-gray-200">
                                    {option.imageUrl && (
                                        <Image
                                            src={option.imageUrl}
                                            alt=""
                                            fill
                                            sizes="28px"
                                            className={`${imageFit === "contain" ? "object-contain" : "object-cover"} object-top-right`}
                                        />
                                    )}
                                </span>
                            )}
                            <span className="truncate">{option.label}</span>
                            <button
                                type="button"
                                onClick={() => removeOption(option.id)}
                                aria-label={`Видалити ${option.label}`}
                                className="text-gray-400 transition hover:text-red-600"
                            >
                                <FiX className="size-5"/>
                            </button>
                        </span>
                    ))}
                </div>
            )}
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default SearchSelect;
