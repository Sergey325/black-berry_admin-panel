import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";

export async function isAdminRequest(request: NextRequest) {
    const token = request.cookies.get("admin_session")?.value;
    return token ? Boolean(await verifyToken(token)) : false;
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: "Необхідна авторизація" }, { status: 401 });
}

export function parseYearMonth(searchParams: URLSearchParams) {
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    if (!Number.isInteger(year) || year < 2020 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
        return null;
    }

    return { year, month };
}
