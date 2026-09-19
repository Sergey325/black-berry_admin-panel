import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function isAdminRequest(request?: NextRequest) {
    const cookieStore = request ? request.cookies : await cookies();
    const token = cookieStore.get("admin_session")?.value;
    return token ? Boolean(await verifyToken(token)) : false;
}

export async function requireAdmin() {
    if (!await isAdminRequest()) throw new Error("Необхідна авторизація");
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: "Необхідна авторизація" }, { status: 401 });
}

export * from "@/app/lib/monthPeriods";
