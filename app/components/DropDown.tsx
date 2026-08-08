'use client';

import {
    useState,
    useRef,
    useEffect,
    useLayoutEffect,
    useCallback,
    useId,
    KeyboardEvent,
} from 'react';
import { FiChevronDown } from 'react-icons/fi';
import useClickOutside from "@/app/hooks/useClickOutside";

export interface DropdownOption<T = string> {
    label: string;
    value: T;
    onClick?: (value: T) => void;
    disabled?: boolean;
}

interface DropdownProps<T = string> {
    options: DropdownOption<T>[];
    value?: T; // controlled value
    defaultValue?: T; // uncontrolled initial value
    placeholder?: string;
    onChange?: (option: DropdownOption<T>) => void;
    disabled?: boolean;
    className?: string;
    buttonClassName?: string;
    menuClassName?: string;
    textCenter?: boolean;
    label?: string;
    error?: string;
}

export default function Dropdown<T = string>({
    options,
    value,
    defaultValue,
    placeholder = 'Выберіть...',
    onChange,
    disabled = false,
    className = '',
    buttonClassName = '',
    menuClassName = '',
    textCenter = false,
    label,
    error,
}: DropdownProps<T>) {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue);
    const selectedValue = isControlled ? value : internalValue;

    const [isOpen, setIsOpen] = useState(false);
    const [openUp, setOpenUp] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

    useClickOutside({ ref: rootRef, onClickOutside: () => setIsOpen(false) })

    const id = useId();
    const listboxId = `dropdown-listbox-${id}`;

    const selectedOption = options.find((opt) => opt.value === selectedValue);

    // адаптивность: открываем вверх, если снизу не хватает места
    useLayoutEffect(() => {
        if (!isOpen || !buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const menuHeight = menuRef.current?.offsetHeight ?? 240;
        setOpenUp(spaceBelow < menuHeight && spaceAbove > spaceBelow);
    }, [isOpen]);

    // проскроллить активный пункт во вьюпорт списка
    useEffect(() => {
        if (isOpen && activeIndex >= 0) {
            optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex, isOpen]);

    const closeMenu = useCallback(() => {
        setIsOpen(false);
        setActiveIndex(-1);
        buttonRef.current?.focus();
    }, []);

    const selectOption = useCallback(
        (option: DropdownOption<T>) => {
            if (option.disabled) return;
            if (!isControlled) setInternalValue(option.value);
            option.onClick?.(option.value); // каллбэк из самого объекта опции
            onChange?.(option); // общий каллбэк дропдауна (удобно для форм)
            closeMenu();
        },
        [isControlled, onChange, closeMenu]
    );

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (disabled) return;

            if (!isOpen) {
                if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
                    e.preventDefault();
                    setIsOpen(true);
                    const startIndex = options.findIndex((o) => o.value === selectedValue);
                    setActiveIndex(startIndex >= 0 ? startIndex : 0);
                }
                return;
            }

            switch (e.key) {
                case 'ArrowDown': {
                    e.preventDefault();
                    setActiveIndex((prev) => {
                        let next = prev;
                        do {
                            next = (next + 1) % options.length;
                        } while (options[next]?.disabled && next !== prev);
                        return next;
                    });
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    setActiveIndex((prev) => {
                        let next = prev;
                        do {
                            next = (next - 1 + options.length) % options.length;
                        } while (options[next]?.disabled && next !== prev);
                        return next;
                    });
                    break;
                }
                case 'Enter':
                case ' ': {
                    e.preventDefault();
                    if (activeIndex >= 0) selectOption(options[activeIndex]);
                    break;
                }
                case 'Escape': {
                    e.preventDefault();
                    closeMenu();
                    break;
                }
                case 'Tab': {
                    setIsOpen(false);
                    break;
                }
            }
        },
        [isOpen, disabled, options, selectedValue, activeIndex, selectOption, closeMenu]
    );

    return (
        <div ref={rootRef} className={`relative w-full ${className}`}>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    {label}
                </label>
            )}

            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    setIsOpen((prev) => !prev);
                    if (!isOpen) {
                        const startIndex = options.findIndex((o) => o.value === selectedValue);
                        setActiveIndex(startIndex >= 0 ? startIndex : 0);
                    }
                }}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm transition
                    ${textCenter ? "text-center" : "text-left"}
                    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-500'}
                    ${error ? 'border-red-400' : 'border-gray-300'}
                    ${isOpen ? 'border-gray-500 ring-2 ring-gray-200' : ''}
                    ${buttonClassName}`}
            >
                <span className={`truncate ${selectedOption ? 'text-neutral-900' : 'text-neutral-400'}`}>
                  {selectedOption ? selectedOption.label : placeholder}
                </span>
                <FiChevronDown
                    size={18}
                    className={`shrink-0 text-neutral-500 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

            <ul
                ref={menuRef}
                id={listboxId}
                role="listbox"
                tabIndex={-1}
                className={`
                    absolute z-50 max-h-60 w-full overflow-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-lg
                    transition-all duration-200 ease-out
                    ${openUp ? 'bottom-full mb-1' : 'top-full mt-1'}
                    ${isOpen ? 'translate-y-0 opacity-100 visible' : `${openUp ? 'translate-y-5' : '-translate-y-5'} opacity-0 invisible`}
                    ${menuClassName}
                `}
            >
                {options.length === 0 && (
                    <li className="px-3 py-2 text-sm text-neutral-400">Немає варіантів</li>
                )}
                {options.map((option, index) => {
                    const isSelected = option.value === selectedValue;
                    const isActive = index === activeIndex;

                    return (
                        <li
                            key={index}
                            ref={(el) => {
                                optionRefs.current[index] = el;
                            }}
                            role="option"
                            aria-selected={isSelected}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => selectOption(option)}
                            className={`flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm transition-colors
                            ${textCenter ? "text-center justify-center" : "text-left"}
                            ${option.disabled ? 'pointer-events-none opacity-40' : ''}
                            ${isActive && !option.disabled ? 'bg-gray-100' : ''}
                            ${isSelected ? 'bg-gray-200 text-slate-900 font-semibold' : 'text-neutral-700'}
                        `}
                        >
                            <span className="truncate">{option.label}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
