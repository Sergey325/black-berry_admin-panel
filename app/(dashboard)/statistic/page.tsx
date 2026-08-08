import StatisticsClient from "@/app/(dashboard)/statistic/StatisticsClient";
import { getMonthDistance, parseMonthPeriod } from "@/app/lib/adminApi";

interface Props {
    searchParams: Promise<{ from?: string | string[]; to?: string | string[]; year?: string | string[]; month?: string | string[] }>;
}

function getCurrentPeriod() {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Kyiv",
        year: "numeric",
        month: "numeric",
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return { year: Number(values.year), month: Number(values.month) };
}

export default async function StatisticPage({ searchParams }: Props) {
    const query = await searchParams;
    const from = parseMonthPeriod(typeof query.from === "string" ? query.from : null);
    const to = parseMonthPeriod(typeof query.to === "string" ? query.to : null);
    const legacyYear = typeof query.year === "string" ? Number(query.year) : Number.NaN;
    const legacyMonth = typeof query.month === "string" ? Number(query.month) : Number.NaN;
    const legacyPeriod = Number.isInteger(legacyYear) && legacyYear >= 2020 && legacyYear <= 2100 && Number.isInteger(legacyMonth) && legacyMonth >= 1 && legacyMonth <= 12
        ? { year: legacyYear, month: legacyMonth }
        : null;
    const hasValidRange = Boolean(from && to && getMonthDistance(from, to) >= 0 && getMonthDistance(from, to) < 12);
    const current = getCurrentPeriod();
    const range = hasValidRange && from && to
        ? { from, to }
        : { from: legacyPeriod ?? current, to: legacyPeriod ?? current };

    return <StatisticsClient key={`${range.from.year}-${range.from.month}-${range.to.year}-${range.to.month}`} range={range} normalizeUrl={!hasValidRange} />;
}
