"use client";

import {FocusEvent, ReactNode, useEffect, useLayoutEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";

type Props = {
    children: ReactNode;
    label: string;
    className?: string;
    tooltipClassName?: string;
};

const ToolTip = ({children, label, className = "", tooltipClassName = ""}: Props) => {
    const [isShow, setIsShow] = useState(false);
    const [position, setPosition] = useState<{top: number; left: number}>();
    const ref = useRef<HTMLDivElement>(null);
    const showTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    const show = (immediately = false) => {
        if (showTimeout.current) clearTimeout(showTimeout.current);
        if (immediately) {
            setIsShow(true);
            return;
        }
        showTimeout.current = setTimeout(() => setIsShow(true), 180);
    };

    const hide = () => {
        if (showTimeout.current) clearTimeout(showTimeout.current);
        setIsShow(false);
    };

    useEffect(() => () => {
        if (showTimeout.current) clearTimeout(showTimeout.current);
    }, []);

    useLayoutEffect(() => {
        if (!isShow) return;

        const updatePosition = () => {
            const rect = ref.current?.getBoundingClientRect();
            if (!rect) return;

            setPosition({
                top: rect.bottom + 10,
                left: Math.min(Math.max(rect.left + rect.width / 2, 72), window.innerWidth - 72),
            });
        };

        updatePosition();
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);

        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isShow]);

    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
        hide();
    };

    return (
        <div
            ref={ref}
            className={`relative inline-flex ${className}`}
            onMouseEnter={() => show()}
            onMouseLeave={hide}
            onFocus={() => show(true)}
            onBlur={handleBlur}
        >
            {children}
            {position && typeof document !== "undefined" && createPortal(
                <span
                    className={`pointer-events-none fixed z-100 max-w-56 -translate-x-1/2 ${tooltipClassName}`}
                    style={{
                        top: position.top,
                        left: position.left,
                    }}
                >
                    <span className={`relative block rounded-lg border border-white/10 bg-gray-950 px-3 py-1.5 text-xs font-medium leading-5 text-white shadow-lg shadow-black/20 transition-all duration-150 before:absolute before:-top-1 before:left-1/2 before:size-2 before:-translate-x-1/2 before:rotate-45 before:border-l before:border-t before:border-white/10 before:bg-gray-950 ${isShow ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}>
                        {label}
                    </span>
                </span>,
                document.body,
            )}
        </div>
    );
};

export default ToolTip;
