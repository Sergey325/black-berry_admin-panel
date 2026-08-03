import { FiArrowDownRight, FiArrowUpRight } from "react-icons/fi";

interface Props {
    label: string;
    value: string;
    changePercent?: number | null;
    secondary?: string;
    negative?: boolean;
}

export default function SummaryCard({ label, value, changePercent, secondary, negative = false }: Props) {
    const positiveChange = changePercent !== undefined && changePercent !== null && changePercent >= 0;

    return (
        <div className="flex min-h-32 flex-col rounded-xl border border-gray-300 bg-white p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
                <p className={`text-2xl font-semibold ${negative ? "text-red-600" : "text-gray-900"}`}>{value}</p>
                {changePercent !== undefined && changePercent !== null && (
                    <span className={`mb-0.5 inline-flex items-center text-sm font-medium ${positiveChange ? "text-emerald-600" : "text-red-600"}`}>
                        {positiveChange ? <FiArrowUpRight /> : <FiArrowDownRight />}
                        {Math.abs(changePercent).toLocaleString("uk-UA", { maximumFractionDigits: 2 })}%
                    </span>
                )}
            </div>
            {secondary && <p className="mt-auto whitespace-pre-line pt-3 text-xs leading-5 text-gray-500">{secondary}</p>}
        </div>
    );
}
