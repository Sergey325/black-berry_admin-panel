import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("admin_session")?.value;

    const payload = token ? await verifyToken(token) : null;

    const pathname = request.nextUrl.pathname;
    const isLoginPage = pathname === "/login";

    if (!payload && !isLoginPage) {
        return NextResponse.redirect(
            new URL("/login", request.url)
        );
    }

    if (payload && isLoginPage) {
        return NextResponse.redirect(
            new URL("/", request.url)
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    ],
};