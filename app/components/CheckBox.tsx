"use client"

import {BiSquareRounded} from "react-icons/bi";
import {BsCheck} from "react-icons/bs";

type Props = {
    label: string
    colorOnChecked?: string
    onChange?: (isChecked: boolean) => void
    checked: boolean
    labelStyle?: string
};

const CheckBox = ({label, colorOnChecked, checked, onChange, labelStyle}: Props) => {
    return (
        <div className={`flex items-center gap-1 cursor-pointer group select-none transition text-gray-700 ${checked ? colorOnChecked : "text-current"}`} onClick={() => onChange?.(!checked)}>
            <div className={`
                rounded-md 
                relative
            `}>
                <BiSquareRounded size={20} className=""/>
                <BsCheck size={20} className={`absolute top-0 left-0 ${checked ? "scale-100" : "scale-0"} transition ${colorOnChecked}`}/>
            </div>
            <span className={labelStyle ? labelStyle : "text-base"}>{label}</span>
        </div>
    );
};

export default CheckBox;
