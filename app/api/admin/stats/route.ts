import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, parseMonthRange, unauthorizedResponse } from "@/app/lib/adminApi";
import { getStats } from "@/app/lib/statistics";

export async function GET(request: NextRequest) {
    if (!await isAdminRequest(request)) return unauthorizedResponse();

    const range = parseMonthRange(request.nextUrl.searchParams);
    if (!range) {
        return NextResponse.json({ error: "Вкажіть коректний діапазон до 12 місяців" }, { status: 400 });
    }

    try {
        return NextResponse.json(await getStats(range));
    } catch (error) {
        console.error("Failed to load statistics", error);
        return NextResponse.json({ error: "Не вдалося завантажити статистику" }, { status: 500 });
    }
}
