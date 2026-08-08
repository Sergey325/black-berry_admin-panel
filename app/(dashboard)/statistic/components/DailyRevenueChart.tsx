"use client";

import { useState } from "react";
import { formatCurrency } from "@/app/(dashboard)/statistic/utils";
import { pluralizeUk } from "@/app/utils/pluralizeUk";

interface DailyRevenue {
    date: string;
    revenue: number;
    ordersCount: number;
}

interface Props {
    data: DailyRevenue[];
}

interface MonthSegment {
    month: string;
    days: number;
}

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
});

const longMonthFormatter = new Intl.DateTimeFormat("uk-UA", {
    month: "long",
    timeZone: "UTC",
});

const shortMonthFormatter = new Intl.DateTimeFormat("uk-UA", {
    month: "short",
    timeZone: "UTC",
});

const monthPeriodFormatter = new Intl.DateTimeFormat("uk-UA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
});

function formatOrdersCount(value: number) {
    return `${value.toLocaleString("uk-UA")} ${pluralizeUk(value, ["замовлення", "замовлення", "замовлень"])}`;
}

function formatDate(date: string) {
    return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function getMonthSegments(data: DailyRevenue[]) {
    return data.reduce<MonthSegment[]>((segments, item) => {
        const month = item.date.slice(0, 7);
        const current = segments.at(-1);
        if (current?.month === month) {
            current.days += 1;
        } else {
            segments.push({ month, days: 1 });
        }
        return segments;
    }, []);
}

function getMonthDate(month: string) {
    return new Date(`${month}-01T00:00:00Z`);
}

export default function DailyRevenueChart({ data }: Props) {
    const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
    const [selectedDate, setSelectedDate] = useState(() => data.findLast((item) => item.ordersCount > 0)?.date ?? data[0]?.date ?? "");
    const getValue = (item: DailyRevenue) => metric === "revenue" ? item.revenue : item.ordersCount;
    const maxValue = Math.max(...data.map(getValue), 1);
    const selectedItem = data.find((item) => item.date === selectedDate) ?? data.findLast((item) => item.ordersCount > 0) ?? data[0];
    const hasOrders = data.some((item) => item.ordersCount > 0);
    const monthSegments = getMonthSegments(data);
    const compactMonthLabels = monthSegments.length > 4;
    const showMonthsOnBottom = monthSegments.length >= 4;

    return (
        <div className="w-full min-w-0 pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold">Динаміка за днями</h2>
                    <p className="mt-1 text-sm text-gray-500">Дохід і кількість замовлень за датою оплати у часовому поясі Києва</p>
                </div>
                <div className="inline-flex shrink-0 self-start rounded-lg bg-gray-100 p-1" role="group" aria-label="Показник графіка">
                    <button
                        type="button"
                        onClick={() => setMetric("revenue")}
                        aria-pressed={metric === "revenue"}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${metric === "revenue" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        Дохід
                    </button>
                    <button
                        type="button"
                        onClick={() => setMetric("orders")}
                        aria-pressed={metric === "orders"}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${metric === "orders" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        Замовлення
                    </button>
                </div>
            </div>
            {!hasOrders ? (
                <div className="mt-4 flex min-h-44 items-center justify-center rounded-lg bg-gray-50 px-4 text-center text-gray-400">
                    Оплачених замовлень за цей період ще немає
                </div>
            ) : (
                <>
                    {selectedItem && (
                        <div className="mt-4 flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
                            <span className="font-medium capitalize text-gray-700">{formatDate(selectedItem.date)}</span>
                            <span className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
                                <span>Дохід: <strong className="font-semibold text-gray-900">{formatCurrency(selectedItem.revenue)}</strong></span>
                                <span><strong className="font-semibold text-gray-900">{formatOrdersCount(selectedItem.ordersCount)}</strong></span>
                            </span>
                        </div>
                    )}
                    <div className={`relative flex h-64 w-full min-w-0 items-end overflow-hidden border-b border-gray-300 px-1 pt-8 sm:px-2 ${data.length > 62 ? "gap-0" : "gap-0.5 sm:gap-1"}`}>
                        {monthSegments.length > 1 && (
                            <div className={`pointer-events-none absolute inset-x-0 z-10 flex h-5 px-1 sm:px-2 ${showMonthsOnBottom ? "bottom-0" : "top-2"}`}>
                                {monthSegments.map((segment) => {
                                    const monthDate = getMonthDate(segment.month);
                                    return (
                                        <span
                                            key={segment.month}
                                            className="min-w-0 truncate text-center text-[11px] capitalize text-gray-500"
                                            style={{ flexBasis: 0, flexGrow: segment.days }}
                                            title={monthPeriodFormatter.format(monthDate)}
                                        >
                                            {(compactMonthLabels ? shortMonthFormatter : longMonthFormatter).format(monthDate)}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                        {data.map((item, index) => {
                            const day = new Date(`${item.date}T00:00:00Z`).getUTCDate();
                            const value = getValue(item);
                            const height = value === 0 ? 1 : Math.max((value / maxValue) * 100, 4);
                            const showLabel = day === 1 || index === 0 || index === data.length - 1 || day % 5 === 0;
                            const formattedValue = metric === "revenue" ? formatCurrency(value) : formatOrdersCount(value);
                            const isSelected = selectedItem?.date === item.date;

                            return (
                                <button
                                    key={item.date}
                                    type="button"
                                    onClick={() => setSelectedDate(item.date)}
                                    onFocus={() => setSelectedDate(item.date)}
                                    onPointerEnter={() => setSelectedDate(item.date)}
                                    aria-pressed={isSelected}
                                    aria-label={`${formatDate(item.date)}: ${formattedValue}`}
                                    title={`${formatDate(item.date)}: ${formattedValue}`}
                                    className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 focus-visible:outline-none"
                                >
                                    <span className="flex h-[calc(100%-24px)] w-full items-end">
                                        <span
                                            className={`w-full rounded-t-sm transition group-hover:bg-primary group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-1 ${isSelected ? "bg-primary" : "bg-primary/80"}`}
                                            style={{ height: `${height}%` }}
                                        />
                                    </span>
                                    <span className="h-5 truncate text-[10px] text-gray-500">{!showMonthsOnBottom && showLabel ? day : ""}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
