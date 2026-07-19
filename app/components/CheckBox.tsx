"use client"

import {useState} from "react";
import {BiSquareRounded} from "react-icons/bi";
import {BsCheck} from "react-icons/bs";

type Props = {
    label: string
    colorOnChecked?: string
    onChange?: (isChecked: boolean) => void
    initialValue?: boolean
    labelStyle?: string
};

const CheckBox = ({label, colorOnChecked, initialValue = false, onChange, labelStyle}: Props) => {
    const [isChecked, setIsChecked] = useState(initialValue)

    const handleClick = () => {
        onChange?.(!isChecked)
        setIsChecked(!isChecked)
    }

    return (
        <div className={`flex items-center gap-1 cursor-pointer group select-none transition text-gray-700 ${isChecked ? colorOnChecked : "text-current"}`} onClick={handleClick}>
            <div className={`
                rounded-md 
                relative
            `}>
                <BiSquareRounded size={20} className=""/>
                <BsCheck size={20} className={`absolute top-0 left-0 ${isChecked ? "scale-100" : "scale-0"} transition ${colorOnChecked}`}/>
            </div>
            <span className={labelStyle ? labelStyle : "text-base"}>{label}</span>
        </div>
    );
};

export default CheckBox;