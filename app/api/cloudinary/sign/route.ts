import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { verifyToken } from "@/app/lib/auth";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get("admin_session")?.value;
        const session = token ? await verifyToken(token) : null;

        if (!session) {
            return NextResponse.json({ error: "Необхідна авторизація" }, { status: 401 });
        }

        const { paramsToSign } = await request.json();

        if (!paramsToSign || typeof paramsToSign !== "object") {
            return NextResponse.json({ error: "Некоректні параметри завантаження" }, { status: 400 });
        }

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET ?? ""
        );

        return NextResponse.json({ signature });
    } catch (error) {
        console.error("Cloudinary signature error:", error);
        return NextResponse.json({ error: "Не вдалося підписати завантаження" }, { status: 500 });
    }
}
