export type FormValuesProduct = {
    name: string;
    slug: string;
    description: string;
    price: number;
    discount: number | null;
    colors: {
        color: string;
        colorName: string;
        images: string[];
        sizes: { size: string; available: boolean }[];
    }[];
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