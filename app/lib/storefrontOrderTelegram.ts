import "server-only";

const STOREFRONT_ORDER_TELEGRAM_TIMEOUT_MS = 10_000;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

async function getErrorMessage(response: Response): Promise<string> {
    const responseText = await response.text();

    if (responseText.length > 0) {
        try {
            const body: unknown = JSON.parse(responseText);
            if (isRecord(body) && typeof body.error === "string") {
                return body.error;
            }
        } catch {
            return responseText.slice(0, 500);
        }
    }

    return `Storefront Telegram notification returned status ${response.status}`;
}

export async function notifyStorefrontOrderTelegram(orderId: number): Promise<void> {
    const storefrontUrl = process.env.STOREFRONT_URL;
    const secret = process.env.STOREFRONT_API_SECRET;

    if (!storefrontUrl || !secret) {
        throw new Error("Storefront Telegram notification is not configured");
    }

    console.log(`Storefront Order Telegram for ${orderId}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), STOREFRONT_ORDER_TELEGRAM_TIMEOUT_MS);

    try {
        let response: Response;

        try {
            response = await fetch(
                `${storefrontUrl.replace(/\/+$/, "")}/api/internal/orders/${orderId}/telegram`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${secret}`,
                    },
                    cache: "no-store",
                    signal: controller.signal,
                },
            );
        } catch {
            throw new Error("Storefront Telegram notification request failed");
        }

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }
    } finally {
        clearTimeout(timeout);
    }
}
