import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, parseYearMonth, unauthorizedResponse } from "@/app/lib/adminApi";
import { getMonthlyStats } from "@/app/lib/statistics";

export async function GET(request: NextRequest) {
    if (!await isAdminRequest(request)) return unauthorizedResponse();

    const period = parseYearMonth(request.nextUrl.searchParams);
    if (!period) {
        return NextResponse.json({ error: "Вкажіть коректні рік і місяць" }, { status: 400 });
    }

    try {
        return NextResponse.json(await getMonthlyStats(period.year, period.month));
    } catch (error) {
        console.error("Failed to load monthly statistics", error);
        return NextResponse.json({ error: "Не вдалося завантажити статистику" }, { status: 500 });
    }
}
