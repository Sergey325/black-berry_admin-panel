import { NextResponse } from "next/server";
import {isAdminRequest, unauthorizedResponse} from "@/app/lib/adminApi";
import { deleteCloudinaryImageByUrl } from "@/app/lib/cloudinary";

type DeleteCloudinaryRequest = {
    imageUrl?: string;
};

export async function DELETE(req: Request) {
    if (!await isAdminRequest()) return unauthorizedResponse();
    try {
        const body: DeleteCloudinaryRequest = await req.json();

        if (typeof body.imageUrl === "string" && body.imageUrl.trim()) {
            const result = await deleteCloudinaryImageByUrl(body.imageUrl);
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: "Не передано зображення для видалення" }, { status: 400 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Не вдалося видалити зображення" }, { status: 500 });
    }
}
