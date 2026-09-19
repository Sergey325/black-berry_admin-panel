import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";

export async function proxy(request: NextRequest) {
    const token = request.cookies.get("admin_session")?.value;

    const payload = token ? await verifyToken(token) : null;

    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith("/api/")) {
        if (pathname === "/api/login" || pathname === "/api/cron/update-ttn-status") return NextResponse.next();
        return payload ? NextResponse.next() : NextResponse.json({error: "Необхідна авторизація"}, {status: 401});
    }
    const isLoginPage = pathname === "/login";
    const isRootPage = pathname === "/";

    if (!payload && !isLoginPage) {
        return NextResponse.redirect(
            new URL("/login", request.url)
        );
    }

    if (payload && isLoginPage) {
        return NextResponse.redirect(
            new URL("/products?tab=AllProducts", request.url)
        );
    }

    if (payload && isRootPage) {
        return NextResponse.redirect(
            new URL("/products?tab=AllProducts", request.url)
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    ],
};
