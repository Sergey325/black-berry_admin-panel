"use client"

import { useEffect, useState } from "react";
import {AiOutlineArrowUp} from "react-icons/ai";

const BackToTop = () => {
    const [show, setShow] = useState(false)


    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            setShow(scrollTop > 200);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <div
            className={`
                ${show ? "block" : "hidden"} 
                fixed 
                bottom-20 right-5 lg:right-20 
                rounded-full 
                bg-[#823D9A] text-white
                p-2 lg:p-4 
                animate-bounce 
                shadow-xl
                
                cursor-pointer
                z-20
            `}
            onClick={scrollToTop}
        >
            <AiOutlineArrowUp size={24}/>
        </div>
    );
};

export default BackToTop;