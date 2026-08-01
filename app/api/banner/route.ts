import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

type BannerRequest = {
    id?: number;
    image?: string;
    badge?: string;
    title?: string;
    features?: string[];
    ctaHref?: string;
    ctaLabel?: string;
    order?: number;
};

const stringValue = (value?: string) => value?.trim() ?? "";
const nullableStringValue = (value?: string) => stringValue(value) || null;

export async function POST(request: Request) {
    try {
        const body: BannerRequest = await request.json();
        const id = body.id;
        const image = stringValue(body.image);
        const title = stringValue(body.title);
        const features = body.features?.map((feature) => feature.trim()).filter(Boolean) ?? [];
        const order = body.order;

        if (!image || !title) {
            return NextResponse.json({ error: "Заповніть усі обов'язкові поля" }, { status: 400 });
        }

        if (typeof order !== "number" || !Number.isInteger(order) || order < 0) {
            return NextResponse.json({ error: "Вкажіть коректний порядок" }, { status: 400 });
        }

        const data = {
            image,
            title,
            features,
            badge: nullableStringValue(body.badge),
            ctaHref: nullableStringValue(body.ctaHref),
            ctaLabel: nullableStringValue(body.ctaLabel),
            order,
        };

        if (typeof id === "number" && Number.isInteger(id) && id > 0) {
            await prisma.banner.update({ where: { id }, data });
        } else {
            await prisma.banner.create({ data });
        }

        return NextResponse.json(null, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Не вдалося зберегти банер" }, { status: 500 });
    }
}
