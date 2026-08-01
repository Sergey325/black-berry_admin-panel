export type FormValuesProduct = {
    name: string;
    slug: string;
    description: string;
    price: number;
    discount: number | null;
    quantity: number | null;
    materialId: number;
    colors: {
        color: string;
        colorName: string;
        colorCode: string | null;
        isBestSeller: boolean;
        images: string[];
        sizes: { size: string; available: boolean }[];
    }[];
    relatedProducts: {
        id: number;
        name: string;
        imageUrl: string
    }[]
    categoryId: number | null;
};

export type FormValuesCategory = {
    name: string;
    coverImage: string;
    season: "SUMMER" | "WINTER" | "ALL_SEASON";
    productsDescription: string;
    description: string;
    isOnMainPage: boolean;
    hasLining: boolean;
    isDecoration: boolean;
    specifications: {
        name: string;
        value: string;
    }[];
};

export type FormValuesBanner = {
    image: string;
    badge: string;
    title: string;
    features: { value: string }[];
    ctaHref: string;
    ctaLabel: string;
    order: number;
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
    productId: number;
    productColorId: number;
    name: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
    imageUrl: string;
};


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
