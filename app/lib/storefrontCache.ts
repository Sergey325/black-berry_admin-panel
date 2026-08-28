import "server-only";

export type StorefrontCacheTag = "products" | "categories" | "banners";

const STOREFRONT_REVALIDATION_TIMEOUT_MS = 5_000;

export async function invalidateStorefrontCache(tags: StorefrontCacheTag[]): Promise<void> {
    const storefrontUrl = process.env.STOREFRONT_URL;
    const secret = process.env.STOREFRONT_REVALIDATE_SECRET;

    if (!storefrontUrl || !secret) {
        throw new Error("Storefront cache revalidation is not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), STOREFRONT_REVALIDATION_TIMEOUT_MS);

    try {
        let response: Response;

        try {
            response = await fetch(`${storefrontUrl.replace(/\/+$/, "")}/api/revalidate`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${secret}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({tags: [...new Set(tags)]}),
                cache: "no-store",
                signal: controller.signal,
            });
        } catch {
            throw new Error("Storefront cache revalidation request failed");
        }

        if (!response.ok) {
            throw new Error(`Storefront cache revalidation returned status ${response.status}`);
        }
    } finally {
        clearTimeout(timeout);
    }
}

export async function tryInvalidateStorefrontCache(tags: StorefrontCacheTag[]): Promise<boolean> {
    try {
        await invalidateStorefrontCache(tags);
        return true;
    } catch (error: unknown) {
        console.error("Storefront cache invalidation failed", {tags, error});
        return false;
    }
}
