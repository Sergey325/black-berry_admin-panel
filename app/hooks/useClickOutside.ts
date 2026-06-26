import { useEffect, RefObject } from "react";

type Props = {
    ref: RefObject<HTMLElement | null>;
    onClickOutside: () => void;
};

const useClickOutside = ({ ref, onClickOutside }: Props) => {
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClickOutside();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, onClickOutside]);
};

export default useClickOutside;