import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/app/lib/auth";

export async function POST(request: Request) {
    const { password } = await request.json();
    console.log("HASH:", process.env.ADMIN_PASSWORD_HASH);
    console.log(process.env.NODE_ENV);
    console.log(Object.keys(process.env));
    const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH!);

    if (!isValid) {
        return NextResponse.json({ error: "Невірний пароль" }, { status: 401 });
    }

    const token = await signToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
    });

    return response;
}