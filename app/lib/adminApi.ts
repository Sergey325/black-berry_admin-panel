import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";

export async function isAdminRequest(request: NextRequest) {
    const token = request.cookies.get("admin_session")?.value;
    return token ? Boolean(await verifyToken(token)) : false;
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: "Необхідна авторизація" }, { status: 401 });
}

export interface MonthPeriod {
    year: number;
    month: number;
}

export interface MonthRange {
    from: MonthPeriod;
    to: MonthPeriod;
}

export function formatMonthPeriod(period: MonthPeriod) {
    return `${period.year}-${String(period.month).padStart(2, "0")}`;
}

export function parseMonthPeriod(value: string | null) {
    const match = value?.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!Number.isInteger(year) || year < 2020 || year > 2100 || month < 1 || month > 12) return null;

    return { year, month };
}

export function getMonthDistance(from: MonthPeriod, to: MonthPeriod) {
    return (to.year - from.year) * 12 + to.month - from.month;
}

export function getMonthPeriods(range: MonthRange) {
    const count = getMonthDistance(range.from, range.to) + 1;
    return Array.from({ length: count }, (_, index) => {
        const value = range.from.year * 12 + range.from.month - 1 + index;
        return { year: Math.floor(value / 12), month: value % 12 + 1 };
    });
}

export function parseMonthRange(searchParams: URLSearchParams): MonthRange | null {
    const from = parseMonthPeriod(searchParams.get("from"));
    const to = parseMonthPeriod(searchParams.get("to"));
    if (!from || !to) return null;

    const distance = getMonthDistance(from, to);
    if (distance < 0 || distance >= 12) return null;

    return { from, to };
}

export function normalizeDateOnly(value: unknown) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return undefined;

    return date;
}
