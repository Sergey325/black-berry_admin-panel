"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {FiImage, FiRefreshCw} from "react-icons/fi";
import DailyRevenueChart from "@/app/(dashboard)/statistic/components/DailyRevenueChart";
import ExpensesManager from "@/app/(dashboard)/statistic/components/ExpensesManager";
import StatusBreakdown from "@/app/(dashboard)/statistic/components/StatusBreakdown";
import SummaryCard from "@/app/(dashboard)/statistic/components/SummaryCard";
import { formatCurrency, getOrdersChange } from "@/app/(dashboard)/statistic/utils";
import {MonthlyExpense, MonthlyStats} from "@/app/types";
import { formatMonthPeriod, getMonthDistance, parseMonthPeriod } from "@/app/lib/adminApi";
import type { MonthRange } from "@/app/lib/adminApi";

interface Props {
    range: MonthRange;
    normalizeUrl: boolean;
}

function EmptySection({ text }: { text: string }) {
    return (
        <div className="flex min-h-44 items-center justify-center rounded-lg bg-gray-50 px-4 text-center text-gray-400">
            {text}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-6 py-8" aria-label="Завантаження статистики">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-xl bg-gray-200" />)}
            </div>
            <div className="h-80 animate-pulse rounded-xl bg-gray-200" />
        </div>
    );
}

export default function StatisticsClient({ range, normalizeUrl }: Props) {
    const router = useRouter();
    const from = formatMonthPeriod(range.from);
    const to = formatMonthPeriod(range.to);
    const [draftFrom, setDraftFrom] = useState(from);
    const [draftTo, setDraftTo] = useState(to);
    const [stats, setStats] = useState<MonthlyStats | null>(null);
    const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const requestId = useRef(0);

    const loadData = useCallback(async (showLoading = true) => {
        const currentRequest = ++requestId.current;
        if (showLoading) setLoading(true);
        setError(false);

        try {
            const [statsResponse, expensesResponse] = await Promise.all([
                axios.get<MonthlyStats>("/api/admin/stats", { params: { from, to } }),
                axios.get<MonthlyExpense[]>("/api/admin/expenses", { params: { from, to } }),
            ]);
            if (currentRequest === requestId.current) {
                setStats(statsResponse.data);
                setExpenses(expensesResponse.data);
            }
        } catch {
            if (currentRequest === requestId.current) setError(true);
        } finally {
            if (currentRequest === requestId.current) setLoading(false);
        }
    }, [from, to]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadData();
        }, 0);

        return () => window.clearTimeout(timeout);
    }, [loadData]);

    useEffect(() => {
        if (normalizeUrl) router.replace(`/statistic?from=${from}&to=${to}`);
    }, [from, normalizeUrl, router, to]);

    const draftFromPeriod = parseMonthPeriod(draftFrom);
    const draftToPeriod = parseMonthPeriod(draftTo);
    const draftDistance = draftFromPeriod && draftToPeriod ? getMonthDistance(draftFromPeriod, draftToPeriod) : -1;
    const invalidRange = draftDistance < 0 || draftDistance >= 12;
    const applyRange = () => {
        if (invalidRange) return;
        router.push(`/statistic?from=${draftFrom}&to=${draftTo}`);
    };

    const refundedOrdersLabel = stats ? `${stats.refundedOrdersCount} ${stats.refundedOrdersCount === 1 ? "замовлення" : "замовлень"}` : "";
    const revenueSecondary = stats ? [
        stats.pendingCashOnDeliveryAmount > 0 ? `Очікується післяплатою: ${formatCurrency(stats.pendingCashOnDeliveryAmount)}` : null,
        stats.refundedOrdersCount > 0 ? `↩ ${formatCurrency(stats.refundedAmount)} повернено (${refundedOrdersLabel})` : null,
    ].filter((value): value is string => value !== null).join("\n") : "";
    const maxCategorySold = Math.max(...(stats?.topCategories.map((category) => category.totalSold) ?? []), 1);

    return (
        <main className="py-6 md:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">Статистика</h1>
                    <p className="mt-1 text-sm text-gray-500">Продажі, прибуток і витрати за обраний період</p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                    <label className="text-xs text-gray-500">
                        Від
                        <input type="month" min="2020-01" max="2100-12" value={draftFrom} onChange={(event) => setDraftFrom(event.target.value)} className="mt-1 block px-3 py-1.5 text-sm text-gray-900 bg-white" />
                    </label>
                    <label className="text-xs text-gray-500">
                        До
                        <input type="month" min="2020-01" max="2100-12" value={draftTo} onChange={(event) => setDraftTo(event.target.value)} className="mt-1 block px-3 py-1.5 text-sm text-gray-900 bg-white" />
                    </label>
                    <button type="button" onClick={applyRange} disabled={invalidRange} className="rounded-md bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40">
                        Застосувати
                    </button>
                    {invalidRange && <p className="w-full text-xs text-red-600 sm:text-right">Оберіть від 1 до 12 місяців</p>}
                </div>
            </div>

            {loading && <LoadingState />}

            {!loading && error && (
                <div className="mt-8 flex min-h-80 flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-4 text-center">
                    <p className="text-red-700">Не вдалося завантажити статистику. Спробуйте ще раз.</p>
                    <button type="button" onClick={() => loadData()} className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">
                        <FiRefreshCw /> Повторити
                    </button>
                </div>
            )}

            {!loading && !error && stats && (
                <div className="mt-7 space-y-6">
                    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                        <SummaryCard
                            label="Дохід"
                            value={formatCurrency(stats.revenue)}
                            changePercent={stats.previousPeriod.revenueChangePercent}
                            secondary={revenueSecondary || undefined}
                        />
                        <SummaryCard label="Витрати" value={formatCurrency(stats.expenses)} />
                        <SummaryCard label="Чистий прибуток" value={formatCurrency(stats.netProfit)} changePercent={stats.previousPeriod.profitChangePercent} negative={stats.netProfit < 0} />
                        <SummaryCard label="Замовлення" value={stats.ordersCount.toLocaleString("uk-UA")} changePercent={getOrdersChange(stats.ordersCount, stats.previousPeriod.ordersCount)} />
                        <SummaryCard label="Середній чек" value={formatCurrency(stats.averageOrderValue)} />
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
                        <div className="min-w-0 rounded-xl border border-gray-300 bg-white p-4 md:p-5">
                            <DailyRevenueChart data={stats.dailyRevenue} />
                        </div>
                        <div className="rounded-xl border border-gray-300 bg-white p-4 md:p-5">
                            <h2 className="text-lg font-semibold">Статуси замовлень</h2>
                            <p className="mt-1 text-sm text-gray-500">Усі замовлення, створені за період</p>
                            <div className="mt-5"><StatusBreakdown data={stats.statusBreakdown} /></div>
                        </div>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-2">
                        <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
                            <div className="px-4 py-4 md:px-5"><h2 className="text-lg font-semibold">Топ товарів</h2></div>
                            {stats.topProducts.length === 0 ? (
                                <div className="px-4 pb-4"><EmptySection text="Немає проданих товарів за цей період" /></div>
                            ) : (
                                <div className="min-w-0">
                                    <div className="hidden grid-cols-[minmax(0,1fr)_90px_170px] gap-3 border-y border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 sm:grid">
                                        <span>Товар</span><span className="text-center">Продано</span><span className="text-right">Дохід</span>
                                    </div>
                                    {stats.topProducts.map((product) => (
                                        <div key={`${product.productId ?? "custom"}-${product.name}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-gray-200 px-4 py-3 first:border-t-0 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_90px_170px] sm:border-t-0 sm:border-b">
                                            <div className="flex min-w-0 items-center gap-3">
                                                {product.imageUrl ? (
                                                    <Image src={product.imageUrl} width={48} height={48} alt={product.name} className="size-12 shrink-0 rounded-md border border-gray-200 object-cover" />
                                                ) : (
                                                    <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-400">
                                                        <FiImage className="size-5"/>
                                                    </span>
                                                )}
                                                <span className="min-w-0 break-words text-sm sm:text-base" title={product.name}>{product.name}</span>
                                            </div>
                                            <span className="shrink-0 text-right text-sm text-gray-500 sm:text-center sm:text-base sm:text-gray-900">
                                                <span className="sm:hidden">{product.totalSold} од.</span>
                                                <span className="hidden sm:inline">{product.totalSold}</span>
                                            </span>
                                            <span className="col-span-2 min-w-0 text-right font-medium sm:col-span-1">
                                                {formatCurrency(product.revenue)}
                                                {product.pendingGoodsValue > 0 && <span className="mt-0.5 block break-words text-xs font-normal text-amber-600">(товарів на {formatCurrency(product.pendingGoodsValue)} очікує доставки)</span>}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border border-gray-300 bg-white p-4 md:p-5">
                            <h2 className="text-lg font-semibold">Топ категорій</h2>
                            <div className="mt-5">
                                {stats.topCategories.length === 0 ? <EmptySection text="Немає даних про категорії за цей період" /> : (
                                    <div className="space-y-4">
                                        {stats.topCategories.map((category) => (
                                            <div key={category.categoryId}>
                                                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                                                    <span className="truncate">{category.name}</span>
                                                    <span className="shrink-0 text-right text-gray-500">
                                                        {category.totalSold} од. · {formatCurrency(category.revenue)}
                                                        {category.pendingGoodsValue > 0 && <span className="block text-xs text-amber-600">(товарів на {formatCurrency(category.pendingGoodsValue)} очікує доставки)</span>}
                                                    </span>
                                                </div>
                                                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                                                    <div className="h-full rounded-full bg-primary" style={{ width: `${(category.totalSold / maxCategorySold) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-300 bg-white p-4 md:p-5">
                        <h2 className="text-lg font-semibold">Популярні кольори</h2>
                        <div className="mt-4">
                            {stats.topColors.length === 0 ? <EmptySection text="Немає даних про кольори за цей період" /> : (
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {stats.topColors.map((color) => (
                                        <div key={color.color} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3">
                                            <span className="size-7 shrink-0 rounded-full border border-gray-300" style={{ backgroundColor: color.color }} />
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{color.colorName || color.color}</p>
                                                {color.colorName && <p className="truncate text-xs text-gray-500">{color.color}</p>}
                                            </div>
                                            <span className="ml-auto shrink-0 text-sm text-gray-500">{color.totalSold} од.</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <ExpensesManager key={`${from}-${to}`} expenses={expenses} range={range} onChanged={() => loadData(false)} />
                </div>
            )}
        </main>
    );
}
