import { NextResponse } from "next/server";
import {isAdminRequest, unauthorizedResponse} from "@/app/lib/adminApi";

export async function POST(req: Request) {
    if (!await isAdminRequest()) return unauthorizedResponse();
    const body = await req.json();

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_SHOP_URL}/api/cities`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }
    );

    const data = await res.json();

    return NextResponse.json(data, {
        status: res.status,
    });
}
