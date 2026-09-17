import "server-only";

export type StorefrontFiscalizationType = "initial" | "afterpayment";

const STOREFRONT_FISCALIZATION_TIMEOUT_MS = 45_000;

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

    return `Storefront fiscalization returned status ${response.status}`;
}

export async function fiscalizeStorefrontOrder(
    orderId: number,
    type: StorefrontFiscalizationType,
): Promise<void> {
    const storefrontUrl = process.env.STOREFRONT_URL;
    const secret = process.env.STOREFRONT_API_SECRET;

    if (!storefrontUrl || !secret) {
        throw new Error("Storefront fiscalization is not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), STOREFRONT_FISCALIZATION_TIMEOUT_MS);

    try {
        let response: Response;

        try {
            response = await fetch(
                `${storefrontUrl.replace(/\/+$/, "")}/api/internal/orders/${orderId}/fiscalize`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${secret}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({type}),
                    cache: "no-store",
                    signal: controller.signal,
                },
            );
        } catch {
            throw new Error("Storefront fiscalization request failed");
        }

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }
    } finally {
        clearTimeout(timeout);
    }
}
