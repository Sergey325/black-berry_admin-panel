import StatisticsClient from "@/app/(dashboard)/statistic/StatisticsClient";

interface Props {
    searchParams: Promise<{ year?: string | string[]; month?: string | string[] }>;
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
    const queryYear = typeof query.year === "string" ? Number(query.year) : Number.NaN;
    const queryMonth = typeof query.month === "string" ? Number(query.month) : Number.NaN;
    const hasValidPeriod = Number.isInteger(queryYear) && queryYear >= 2020 && queryYear <= 2100 && Number.isInteger(queryMonth) && queryMonth >= 1 && queryMonth <= 12;
    const period = hasValidPeriod ? { year: queryYear, month: queryMonth } : getCurrentPeriod();

    return <StatisticsClient year={period.year} month={period.month} normalizeUrl={!hasValidPeriod} />;
}
