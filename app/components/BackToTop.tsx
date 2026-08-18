"use client"

import { useEffect, useState } from "react";
import {AiOutlineArrowDown, AiOutlineArrowUp} from "react-icons/ai";

type ScrollDirection = "up" | "down" | null;

const BackToTop = () => {
    const [direction, setDirection] = useState<ScrollDirection>(null);


    useEffect(() => {
        const updateDirection = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const form = document.querySelector<HTMLFormElement>("form[data-scroll-navigation]");

            if (form) {
                const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
                const target = submitButton ?? form;
                const targetIsBelowViewport = target.getBoundingClientRect().bottom > window.innerHeight - 24;

                setDirection(targetIsBelowViewport ? "down" : scrollTop > 200 ? "up" : null);
                return;
            }

            setDirection(scrollTop > 200 ? "up" : null);
        };

        const observer = new MutationObserver(updateDirection);

        updateDirection();
        observer.observe(document.body, {childList: true, subtree: true});
        window.addEventListener("scroll", updateDirection, {passive: true});
        window.addEventListener("resize", updateDirection);

        return () => {
            observer.disconnect();
            window.removeEventListener("scroll", updateDirection);
            window.removeEventListener("resize", updateDirection);
        };
    }, []);

    const handleClick = () => {
        if (direction === "down") {
            const form = document.querySelector<HTMLFormElement>("form[data-scroll-navigation]");
            const submitButton = form?.querySelector<HTMLButtonElement>('button[type="submit"]');

            (submitButton ?? form)?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            return;
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    if (!direction) return null;

    const isScrollingDown = direction === "down";
    const label = isScrollingDown ? "До кнопки збереження" : "На початок сторінки";

    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className="fixed bottom-20 right-5 z-20 cursor-pointer animate-bounce rounded-full bg-primary-dark p-2 text-white shadow-xl transition hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 lg:right-20 lg:p-4"
            onClick={handleClick}
        >
            {isScrollingDown ? <AiOutlineArrowDown size={24}/> : <AiOutlineArrowUp size={24}/>}
        </button>
    );
};

export default BackToTop;
