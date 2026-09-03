import type {PromoScope, PromoSelectOption} from "@/app/actions/getPromoCodes";

export type CacheInvalidationResponse = {
    cacheInvalidated: boolean;
};

export type FormValuesProduct = {
    name: string;
    slug: string;
    description: string;
    price: number;
    discount: number | null;
    hasLining: boolean;
    materialId: number;
    colors: {
        id?: number;
        color: string;
        colorName: string;
        colorCode: string | null;
        catalogColorIds: number[];
        isBestSeller: boolean;
        images: string[];
        sizes: { id?: number; size: string; available: boolean; quantity: number | null }[];
    }[];
    relatedProducts: {
        id: number;
        name: string;
        imageUrl: string
    }[]
    specificationOverrides: {
        categorySpecificationId: number;
        value: string;
    }[];
    categoryId: number | null;
};

export type FormValuesCategory = {
    name: string;
    coverImage: string;
    sizeGuideImage: string;
    season: "SUMMER" | "WINTER" | "ALL_SEASON";
    productsDescription: string;
    description: string;
    isOnMainPage: boolean;
    isDecoration: boolean;
    defaultSizes: string[];
    specifications: {
        name: string;
        value: string;
    }[];
};

export type FormValuesBanner = {
    image: string;
    mobileImage: string;
    badge: string;
    title: string;
    features: { value: string }[];
    ctaHref: string;
    ctaLabel: string;
};


export type FormValuesOrder = {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    comment: string;
    city: string;
    area: string;
    cityRef: string;
    warehouse: string;
    warehouseRef: string;
    paymentMethod: "MONOBANK" | "CASH_ON_DELIVERY";
    items: OrderItem[];
};

export type OrderItem = {
    productId: number | null;
    productColorId: number | null;
    name: string;
    color: string;
    colorName: string;
    colorCode: string;
    size: string;
    price: number;
    quantity: number;
    imageUrl: string;
    isCustom: boolean;
};

export interface PromoCodeDetails {
    id: number;
    code: string;
    discountPercent: number;
    scopeType: PromoScope;
    startsAt: string | null;
    expiresAt: string | null;
    maxUses: number | null;
    usedCount: number;
    isActive: boolean;
    categories: PromoSelectOption[];
    products: PromoSelectOption[];
}

export interface PromoCodeFormValues {
    code: string;
    discountPercent: number;
    scopeType: PromoScope;
    categoryIds: number[];
    productIds: number[];
    startsAt: string;
    expiresAt: string;
    maxUses: number | null;
    isActive: boolean;
}

export type City = {
    ref: string;
    name: string;
    area: string
};

export type Warehouse = {
    ref: string;
    number: string;
    description: string
};

export type ContactData = {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    comment: string;
};

export interface MonthlyStats {
    period: { from: { year: number; month: number }; to: { year: number; month: number } };
    revenue: number;
    expenses: number;
    netProfit: number;
    ordersCount: number;
    averageOrderValue: number;
    pendingCashOnDeliveryAmount: number;
    refundedAmount: number;
    refundedOrdersCount: number;
    previousPeriod: {
        revenue: number;
        netProfit: number;
        ordersCount: number;
        revenueChangePercent: number | null;
        profitChangePercent: number | null;
    };
    statusBreakdown: { status: string; count: number }[];
    dailyRevenue: { date: string; revenue: number; ordersCount: number }[];
    topProducts: {
        productId: number | null;
        name: string;
        imageUrl: string | null;
        totalSold: number;
        revenue: number;
        pendingGoodsValue: number;
    }[];
    topCategories: {
        categoryId: number;
        name: string;
        totalSold: number;
        revenue: number;
        pendingGoodsValue: number;
    }[];
    topColors: {
        color: string;
        colorName: string | null;
        totalSold: number;
    }[];
}

export interface MonthlyExpense {
    id: number;
    year: number;
    month: number;
    amount: number;
    description: string | null;
    expenseDate: string | null;
    createdAt: string;
    updatedAt: string;
}
