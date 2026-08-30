"use client";

import {useDeferredValue, useMemo, useRef, useState} from "react";
import {FiCheck, FiX} from "react-icons/fi";
import useClickOutside from "@/app/hooks/useClickOutside";
import type {ICatalogColor} from "@/app/actions/getCatalogColors";

type CatalogColorPreviewProps = {
    colors: ICatalogColor[];
    className?: string;
};

export const CatalogColorPreview = ({colors, className = "size-9"}: CatalogColorPreviewProps) => (
    <span className={`flex shrink-0 overflow-hidden rounded-full border border-gray-300 ${className}`}
    style={{background: createColorGradient(colors.map(c => c.hex))}}
    >
        {/*{colors.length > 0*/}
        {/*    ? colors.map((color) => (*/}
        {/*        <span*/}
        {/*            key={color.id}*/}
        {/*            className="h-full min-w-0 flex-1"*/}
        {/*            style={{backgroundColor: color.hex}}*/}
        {/*        />*/}
        {/*    ))*/}
        {/*    : <span className="h-full w-full bg-gray-100"/>}*/}
    </span>
);

function createColorGradient(colors: string[]): string {
    if (colors.length === 1) {
        return colors[0];
    }

    const segment: number = 100 / colors.length;

    const stops: string = colors
        .flatMap((color: string, index: number): string[] => [
            `${color} ${index * segment}%`,
            `${color} ${(index + 1) * segment}%`,
        ])
        .join(", ");

    return `conic-gradient(from 45deg, ${stops})`;
}

type Props = {
    colors: ICatalogColor[];
    value: number[];
    onChange: (ids: number[]) => void;
    error?: string;
};

const CatalogColorMultiSelect = ({colors, value, onChange, error}: Props) => {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const deferredSearch = useDeferredValue(search.trim().toLowerCase());
    const selectedIds = useMemo(() => new Set(value), [value]);
    const colorsById = useMemo(() => new Map(colors.map((color) => [color.id, color])), [colors]);
    const selectedColors = useMemo(
        () => value.map((id) => colorsById.get(id)).filter((color): color is ICatalogColor => Boolean(color)),
        [colorsById, value],
    );
    const filteredColors = useMemo(() => colors.filter((color) => (
        color.name.toLowerCase().includes(deferredSearch) || color.code.toLowerCase().includes(deferredSearch)
    )), [colors, deferredSearch]);

    useClickOutside({ref: rootRef, onClickOutside: () => setIsOpen(false)});

    const toggleColor = (id: number) => {
        if (selectedIds.has(id)) {
            onChange(value.filter((selectedId) => selectedId !== id));
            return;
        }

        onChange([...new Set([...value, id])]);
    };

    return (
        <div ref={rootRef} className="relative">
            <div className={`flex items-center gap-3 rounded-lg border bg-white px-3 ${error ? "border-red-400" : "border-gray-300"}`}>
                <CatalogColorPreview colors={selectedColors}/>
                <input
                    type="search"
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Пошук за назвою або кодом..."
                    className="min-w-0 flex-1 py-2.5 outline-none border-none"
                />
            </div>
            {isOpen && (
                <div className="absolute top-full z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-300 bg-white p-1 shadow-lg">
                    {filteredColors.length > 0
                        ? filteredColors.map((color) => {
                            const isSelected = selectedIds.has(color.id);

                            return (
                                <button
                                    key={color.id}
                                    type="button"
                                    onClick={() => toggleColor(color.id)}
                                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition hover:bg-gray-100"
                                >
                                    <span className="size-7 shrink-0 rounded-full border border-gray-300" style={{backgroundColor: color.hex}}/>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-gray-900">{color.name}</span>
                                        <span className="block text-xs text-gray-500">Код {color.code}</span>
                                    </span>
                                    <span className={`flex size-5 items-center justify-center rounded border ${isSelected ? "border-gray-950 bg-gray-950 text-white" : "border-gray-300 text-transparent"}`}>
                                        <FiCheck className="size-4"/>
                                    </span>
                                </button>
                            );
                        })
                        : <p className="px-3 py-2 text-sm text-gray-400">Нічого не знайдено</p>}
                </div>
            )}
            {selectedColors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {selectedColors.map((color) => (
                        <span key={color.id} className="flex max-w-full items-center gap-2 rounded-full bg-gray-100 py-1 pr-2 pl-1 text-sm text-gray-700">
                            <span className="size-7 shrink-0 rounded-full border border-gray-300" style={{backgroundColor: color.hex}}/>
                            <span className="truncate">{color.name}</span>
                            <span className="text-xs text-gray-500">{color.code}</span>
                            <button
                                type="button"
                                onClick={() => toggleColor(color.id)}
                                aria-label={`Видалити ${color.name}`}
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

export default CatalogColorMultiSelect;
