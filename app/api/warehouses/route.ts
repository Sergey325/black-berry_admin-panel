import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("sending warehouse request:", body);

        const res = await fetch(
            `${process.env.MAIN_SITE_URL}/api/warehouses`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // "x-api-key": process.env.SHOP_API_KEY!,
                },
                body: JSON.stringify(body),
            }
        );


        const data = await res.json();

        return NextResponse.json(data, {
            status: res.status,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Failed to fetch warehouses" },
            { status: 500 }
        );
    }
}