"use client"

import Link from "next/link";
import {RiLogoutBoxRLine} from "react-icons/ri";
import axios from "axios";
import {useRouter} from "next/navigation";

type Props = {

};

const Navbar = ({}: Props) => {
    const router = useRouter()

    const handleLogout = async () => {
        await axios.post("/api/logout");
        router.push("/login");
        router.refresh();
    };

    return (
        <header className="w-full border-b border-gray-300 text-base text-gray-800 bg-white relative z-20 select-none">
            <div className="w-full">
                <nav className="flex items-center h-18 text-lg lg:text-xl">
                    <div
                        className="w-full text-center h-full border-r flex items-center justify-center hover:bg-gray-200 transition cursor-pointer"
                        onClick={() => router.push("/manageProducts?tab=AllProducts")}
                    >
                        <p>Товари</p>
                    </div>
                    <div
                        className="w-full text-center my-auto h-full border-l flex items-center justify-center hover:bg-gray-200 transition cursor-pointer"
                        onClick={() => router.push("/manageOrders")}
                    >
                        <p>Замовлення</p>
                    </div>
                    {/*<Link href="/about" className="hover:opacity-60 hover:-translate-y-0.5 transition ">Товари</Link>*/}
                    {/*<Link href="/about" className="hover:opacity-60 hover:-translate-y-0.5 transition ">Замовлення</Link>*/}
                    {/*<Link href="/contact" className="hover:opacity-60 hover:-translate-y-0.5 transition ">Умови</Link>*/}
                    {/*<RiLogoutBoxRLine className="size-8 cursor-pointer hover:text-gray-500 transition" onClick={handleLogout}/>*/}
                    {/*<div className="flex-1 w-full flex items-center justify-center text-center border-r h-full">*/}
                    {/*    <p className="">Управління товарами</p>*/}

                    {/*</div>*/}
                    {/*<div className="flex-1 text-center border-l w-full h-full">*/}
                    {/*    Управління замовленнями*/}
                    {/*</div>*/}
                </nav>
            </div>
        </header>
    );
};

export default Navbar;