import { formatCurrency } from "@/app/(dashboard)/statistic/utils";

interface DailyRevenue {
    date: string;
    revenue: number;
}

interface Props {
    data: DailyRevenue[];
}

export default function DailyRevenueChart({ data }: Props) {
    const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);

    return (
        <div className="w-full min-w-0 pb-2">
            <div className="flex h-64 w-full min-w-0 items-end gap-0.5 border-b border-gray-300 px-1 pt-8 sm:gap-1 sm:px-2">
                {data.map((item, index) => {
                    const day = index + 1;
                    const height = item.revenue === 0 ? 1 : Math.max((item.revenue / maxRevenue) * 100, 4);
                    const showLabel = day === 1 || day === data.length || day % 5 === 0;

                    return (
                        <div key={item.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                            <div className="flex h-[calc(100%-24px)] w-full items-end">
                                <div
                                    title={`${day}: ${formatCurrency(item.revenue)}`}
                                    className="w-full rounded-t-sm bg-primary/80 transition hover:bg-primary"
                                    style={{ height: `${height}%` }}
                                />
                            </div>
                            <span className="h-5 text-[10px] text-gray-500">{showLabel ? day : ""}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
