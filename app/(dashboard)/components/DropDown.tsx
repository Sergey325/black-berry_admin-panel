
type Props = {
    options: { value: string, label: string }[],
    handleChange: (value: string) => void,
    currentValue: string,
}

export default function DropDown({options, handleChange, currentValue}: Props) {
    return (
        <select
            value={currentValue}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange(e.target.value)}
            className="border border-gray-200 rounded-sm px-3 py-2 text-base outline-none focus:border-gray-400 transition bg-white w-full sm:max-w-fit text-center font-semibold"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value} className="p-5 text-center">
                    {opt.label}
                </option>
            ))}
        </select>
    );
}