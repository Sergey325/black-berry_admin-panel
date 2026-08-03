import {PromoScopeType} from "@prisma/client";


export interface PromoCodeInput {
    code: string;
    discountPercent: number;
    scopeType: PromoScopeType;
    startsAt: Date | null;
    expiresAt: Date | null;
    maxUses: number | null;
    isActive: boolean;
    categoryIds: number[];
    productIds: number[];
}

type ParseResult =
    | {success: true; data: PromoCodeInput}
    | {success: false; error: string};

const parseIds = (value: unknown) => {
    if (!Array.isArray(value)) return [];

    return [...new Set(value.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
};

const parseDate = (value: unknown) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value !== "string") return undefined;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
};

export const parsePromoCodeInput = (body: unknown): ParseResult => {
    if (typeof body !== "object" || body === null) {
        return {success: false, error: "Invalid request body"};
    }

    const value = body as Record<string, unknown>;
    const code = typeof value.code === "string" ? value.code.trim().toUpperCase() : "";
    const discountPercent = Number(value.discountPercent);
    const scopeType = typeof value.scopeType === "string" && Object.values(PromoScopeType).includes(value.scopeType as PromoScopeType)
        ? value.scopeType as PromoScopeType
        : undefined;
    const startsAt = parseDate(value.startsAt);
    const expiresAt = parseDate(value.expiresAt);
    const rawMaxUses = value.maxUses;
    const maxUses = rawMaxUses === null || rawMaxUses === undefined || rawMaxUses === ""
        ? null
        : Number(rawMaxUses);
    const categoryIds = parseIds(value.categoryIds);
    const productIds = parseIds(value.productIds);

    if (!code) return {success: false, error: "Code is required"};
    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 100) {
        return {success: false, error: "Discount must be between 1 and 100"};
    }
    if (!scopeType) return {success: false, error: "Invalid scope type"};
    if (startsAt === undefined || expiresAt === undefined) return {success: false, error: "Invalid active period"};
    if (startsAt && expiresAt && expiresAt <= startsAt) {
        return {success: false, error: "Expiration date must be after the start date"};
    }
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
        return {success: false, error: "Usage limit must be a positive integer"};
    }
    if (scopeType === PromoScopeType.CATEGORY && categoryIds.length === 0) {
        return {success: false, error: "Select at least one category"};
    }
    if (scopeType === PromoScopeType.PRODUCT && productIds.length === 0) {
        return {success: false, error: "Select at least one product"};
    }

    return {
        success: true,
        data: {
            code,
            discountPercent,
            scopeType,
            startsAt,
            expiresAt,
            maxUses,
            isActive: value.isActive !== false,
            categoryIds: scopeType === PromoScopeType.CATEGORY ? categoryIds : [],
            productIds: scopeType === PromoScopeType.PRODUCT ? productIds : [],
        },
    };
};
