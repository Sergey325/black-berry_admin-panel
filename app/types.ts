type FormValues = {
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