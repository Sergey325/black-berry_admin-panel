import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {tryInvalidateStorefrontCache} from "@/app/lib/storefrontCache";

type BannerRequest = {
    id?: number;
    image?: string;
    mobileImage?: string;
    badge?: string;
    title?: string;
    features?: string[];
    ctaHref?: string;
    ctaLabel?: string;
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

        if (!image || !title) {
            return NextResponse.json({ error: "Заповніть усі обов'язкові поля" }, { status: 400 });
        }

        const data = {
            image,
            mobileImage: nullableStringValue(body.mobileImage),
            title,
            features,
            badge: nullableStringValue(body.badge),
            ctaHref: nullableStringValue(body.ctaHref),
            ctaLabel: nullableStringValue(body.ctaLabel),
        };

        if (typeof id === "number" && Number.isInteger(id) && id > 0) {
            await prisma.banner.update({ where: { id }, data });
        } else {
            const lastBanner = await prisma.banner.aggregate({ _max: { order: true } });
            await prisma.banner.create({
                data: {
                    ...data,
                    order: (lastBanner._max.order ?? -1) + 1,
                },
            });
        }
        const cacheInvalidated = await tryInvalidateStorefrontCache(["banners"]);

        return NextResponse.json({cacheInvalidated}, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Не вдалося зберегти банер" }, { status: 500 });
    }
}
