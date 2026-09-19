import { NextResponse } from "next/server";
import {isAdminRequest, unauthorizedResponse} from "@/app/lib/adminApi";

export async function POST() {
    if (!await isAdminRequest()) return unauthorizedResponse();
    const response = NextResponse.json({ success: true });
    response.cookies.delete("admin_session");
    return response;
}
