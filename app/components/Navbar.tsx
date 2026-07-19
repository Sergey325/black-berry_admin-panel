"use client"

import Link from "next/link";
import axios from "axios";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";

type Props = {

};

const navbarOptions = [
    {
        href: "/manageProducts?tab=AllProducts", label: "Товари",
    },
    {
        href: "/manageOrders", label: "Замовлення",
    },
    {
        href: "/manageCategories?tab=AllCategories", label: "Категорії",
    },
    {
        href: "/manageBanners", label: "Банери",
    },
]

const Navbar = ({}: Props) => {
    const router = useRouter()

    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (menuOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
        return () => {
            document.body.classList.remove('no-scroll');
        };
    }, [menuOpen]);

    const handleLogout = async () => {
        await axios.post("/api/logout");
        router.push("/login");
        router.refresh();
    };

    return (
        <header className="w-full border-b border-gray-300 text-base text-gray-800 bg-white relative z-20 select-none">
            <div className="w-full">
                <nav className="flex items-center w-full h-12 text-lg lg:text-xl">
                    <div className="hidden md:flex items-center h-12 text-lg lg:text-xl w-full">
                        {
                            navbarOptions.map((option, i) =>
                                <Link key={i + option.label} href={option.href} className="w-full text-center my-auto h-full border-l flex items-center justify-center hover:bg-gray-200 transition cursor-pointer">
                                    {option.label}
                                </Link>
                            )
                        }
                    </div>

                    <div className="md:hidden flex items-center justify-end w-full gap-6">
                        <button
                            className="flex flex-col gap-1.5 p-2 mr-5"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Меню"
                        >
                            <span className={`block w-6 h-0.5 bg-gray-800 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
                            <span className={`block w-6 h-0.5 bg-gray-800 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
                            <span className={`block w-6 h-0.5 bg-gray-800 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
                        </button>
                    </div>
                </nav>
            </div>
            {/* Мобильное меню */}
            <div className={`md:hidden fixed inset-0 top-[72px] bg-gray-50 z-20 transition-all duration-300 ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <nav className="flex flex-col h-full px-6 gap-0 overflow-y-auto">
                    {/* Навигация */}
                    <div className="flex flex-col gap-1">

                        {
                            navbarOptions.map((option, i) =>
                                <Link key={i + option.label} href={option.href} onClick={() => setMenuOpen(false)} className="text-lg font-medium py-3 border-b border-gray-800 hover:text-gray-600 transition">
                                    {option.label}
                                </Link>
                            )
                        }
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Navbar;