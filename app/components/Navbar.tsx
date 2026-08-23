"use client"

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect, useState} from "react";
import {FiBarChart2, FiGrid, FiImage, FiPackage, FiShoppingCart, FiTag} from "react-icons/fi";
import ToolTip from "@/app/components/ToolTip";

const navbarOptions = [
    {
        href: "/products?tab=AllProducts",
        path: "/products",
        label: "Товари",
        icon: FiPackage,
    },
    {
        href: "/orders?tab=AllOrders",
        path: "/orders",
        label: "Замовлення",
        icon: FiShoppingCart,
    },
    {
        href: "/categories?tab=AllCategories",
        path: "/categories",
        label: "Категорії",
        icon: FiGrid,
    },
    {
        href: "/banners?tab=AllBanners",
        path: "/banners",
        label: "Банери",
        icon: FiImage,
    },
    { 
        href: "/statistic",
        path: "/statistic",
        label: "Статистика",
        icon: FiBarChart2,
    },
    {
        href: "/promoCodes?tab=AllPromoCodes",
        path: "/promoCodes",
        label: "Промокоди",
        icon: FiTag,
    },
];

const Navbar = () => {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        document.body.classList.toggle("no-scroll", menuOpen);
        return () => document.body.classList.remove("no-scroll");
    }, [menuOpen]);

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 text-gray-800 shadow-sm backdrop-blur select-none">
                <nav className="mx-auto flex h-14 max-w-[1414px] items-center px-3 md:h-16 md:justify-center md:px-6">
                    <div className="hidden w-full items-center gap-1 rounded-xl border border-gray-200 bg-gray-100/80 p-1 sm:flex">
                        {navbarOptions.map((option) => {
                            const isActive = pathname === option.path;
                            const Icon = option.icon;

                            return (
                                <ToolTip key={option.path} label={option.label} className="flex-1" tooltipClassName="lg:hidden">
                                    <Link
                                        href={option.href}
                                        aria-current={isActive ? "page" : undefined}
                                        className={`flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 xl:text-base ${
                                            isActive
                                                ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5"
                                                : "text-gray-600 hover:bg-white/70 hover:text-gray-950"
                                        }`}
                                    >
                                        <Icon className="size-5 shrink-0"/>
                                        <span className="hidden lg:inline">{option.label}</span>
                                    </Link>
                                </ToolTip>
                            );
                        })}
                    </div>

                    <div className="flex w-full items-center justify-end sm:hidden">
                        <button
                            type="button"
                            className="flex size-10 flex-col items-center justify-center gap-1.5 rounded-lg transition hover:bg-gray-100"
                            onClick={() => setMenuOpen((current) => !current)}
                            aria-label="Меню"
                            aria-expanded={menuOpen}
                        >
                            <span className={`block h-0.5 w-6 bg-gray-800 transition-all duration-300 ${menuOpen ? "translate-y-2 rotate-45" : ""}`}/>
                            <span className={`block h-0.5 w-6 bg-gray-800 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}/>
                            <span className={`block h-0.5 w-6 bg-gray-800 transition-all duration-300 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}/>
                        </button>
                    </div>
                </nav>
            </header>

            <div className={`fixed inset-x-0 top-14 bottom-0 z-30 bg-gray-50 transition-all duration-300 md:hidden ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
                <nav className="flex h-full flex-col gap-2 overflow-y-auto px-4 py-4">
                    {navbarOptions.map((option) => {
                        const isActive = pathname === option.path;
                        const Icon = option.icon;

                        return (
                            <Link
                                key={option.path}
                                href={option.href}
                                onClick={() => setMenuOpen(false)}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition ${
                                    isActive
                                        ? "bg-white text-slate-800 shadow-sm ring-1 ring-gray-200"
                                        : "text-gray-600 hover:bg-white"
                                }`}
                            >
                                <Icon className="size-5"/>
                                {option.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
};

export default Navbar;
