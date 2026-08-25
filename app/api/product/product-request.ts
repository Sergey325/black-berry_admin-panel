import type {FormValuesProduct} from "@/app/types";

export type ProductRequest = FormValuesProduct & {
    id: number | null;
};

export type ProductColorRequest = ProductRequest["colors"][number];
export type ProductSpecificationOverrideRequest = ProductRequest["specificationOverrides"][number];

export class ProductRequestError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === "object" && value !== null && !Array.isArray(value)
);

const readString = (value: unknown, field: string): string => {
    if (typeof value !== "string") {
        throw new ProductRequestError(`Поле ${field} має бути рядком`);
    }

    return value;
};

const readNumber = (value: unknown, field: string): number => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new ProductRequestError(`Поле ${field} має бути числом`);
    }

    return value;
};

const readPositiveInteger = (value: unknown, field: string): number => {
    const number = readNumber(value, field);

    if (!Number.isInteger(number) || number <= 0) {
        throw new ProductRequestError(`Поле ${field} має бути додатним цілим числом`);
    }

    return number;
};

const readOptionalPositiveInteger = (value: unknown, field: string): number | undefined => {
    if (value === undefined || value === null) {
        return undefined;
    }

    return readPositiveInteger(value, field);
};

const readNullableQuantity = (value: unknown, field: string): number | null => {
    if (value === null) {
        return null;
    }

    const number = readNumber(value, field);

    if (!Number.isInteger(number) || number < 0) {
        throw new ProductRequestError(`Поле ${field} має бути невід'ємним цілим числом або null`);
    }

    return number;
};

const parseColor = (value: unknown, index: number): ProductColorRequest => {
    if (!isRecord(value)) {
        throw new ProductRequestError(`Некоректний варіант кольору ${index + 1}`);
    }

    if (!Array.isArray(value.images) || !value.images.every((image) => typeof image === "string")) {
        throw new ProductRequestError(`Некоректні зображення варіанта ${index + 1}`);
    }

    if (!Array.isArray(value.catalogColorIds)) {
        throw new ProductRequestError(`Некоректні кольори для фільтрації варіанта ${index + 1}`);
    }

    const catalogColorIds = value.catalogColorIds.map((catalogColorId, catalogColorIndex) => (
        readPositiveInteger(catalogColorId, `colors.${index}.catalogColorIds.${catalogColorIndex}`)
    ));

    if (!Array.isArray(value.sizes)) {
        throw new ProductRequestError(`Некоректні розміри варіанта ${index + 1}`);
    }

    const sizes = value.sizes.map((size, sizeIndex) => {
        if (!isRecord(size) || typeof size.available !== "boolean") {
            throw new ProductRequestError(`Некоректний розмір ${sizeIndex + 1} варіанта ${index + 1}`);
        }

        return {
            id: readOptionalPositiveInteger(size.id, `colors.${index}.sizes.${sizeIndex}.id`),
            size: readString(size.size, `colors.${index}.sizes.${sizeIndex}.size`),
            available: size.available,
            quantity: readNullableQuantity(size.quantity, `colors.${index}.sizes.${sizeIndex}.quantity`),
        };
    });

    if (typeof value.isBestSeller !== "boolean") {
        throw new ProductRequestError(`Некоректне поле isBestSeller варіанта ${index + 1}`);
    }

    return {
        id: readOptionalPositiveInteger(value.id, `colors.${index}.id`),
        color: readString(value.color, `colors.${index}.color`),
        colorName: readString(value.colorName, `colors.${index}.colorName`),
        colorCode: typeof value.colorCode === "string" ? value.colorCode : null,
        catalogColorIds,
        isBestSeller: value.isBestSeller,
        images: value.images,
        sizes,
    };
};

export const parseProductRequest = (value: unknown): ProductRequest => {
    if (
        !isRecord(value)
        || !Array.isArray(value.colors)
        || !Array.isArray(value.relatedProducts)
        || !Array.isArray(value.specificationOverrides)
    ) {
        throw new ProductRequestError("Некоректний payload товару");
    }

    const id = value.id === null ? null : readPositiveInteger(value.id, "id");
    const categoryId = value.categoryId === null ? null : readPositiveInteger(value.categoryId, "categoryId");
    const discount = value.discount === null ? null : readNumber(value.discount, "discount");

    if (typeof value.hasLining !== "boolean") {
        throw new ProductRequestError("Поле hasLining має бути boolean");
    }

    const relatedProducts = value.relatedProducts.map((relatedProduct, index) => {
        if (!isRecord(relatedProduct)) {
            throw new ProductRequestError(`Некоректний пов'язаний товар ${index + 1}`);
        }

        return {
            id: readPositiveInteger(relatedProduct.id, `relatedProducts.${index}.id`),
            name: readString(relatedProduct.name, `relatedProducts.${index}.name`),
            imageUrl: readString(relatedProduct.imageUrl, `relatedProducts.${index}.imageUrl`),
        };
    });
    const specificationOverrides = value.specificationOverrides.map((override, index) => {
        if (!isRecord(override)) {
            throw new ProductRequestError(`Некоректне перевизначення характеристики ${index + 1}`);
        }

        return {
            categorySpecificationId: readPositiveInteger(
                override.categorySpecificationId,
                `specificationOverrides.${index}.categorySpecificationId`,
            ),
            value: readString(override.value, `specificationOverrides.${index}.value`).trim(),
        };
    });

    return {
        id,
        name: readString(value.name, "name"),
        slug: readString(value.slug, "slug"),
        description: readString(value.description, "description"),
        price: readNumber(value.price, "price"),
        discount,
        hasLining: value.hasLining,
        materialId: readPositiveInteger(value.materialId, "materialId"),
        categoryId,
        colors: value.colors.map(parseColor),
        relatedProducts,
        specificationOverrides,
    };
};

export const normalizeColors = (colors: ProductColorRequest[]): ProductColorRequest[] => {
    if (colors.length === 0) {
        throw new ProductRequestError("Додайте хоча б один варіант кольору");
    }

    const normalized = colors.map((color, index) => {
        const catalogColorIds = [...new Set(color.catalogColorIds)];

        if (catalogColorIds.length === 0) {
            throw new ProductRequestError(`Виберіть хоча б один колір для фільтрації варіанта ${index + 1}`);
        }

        if (color.images.length === 0 || color.sizes.length === 0) {
            throw new ProductRequestError(`Варіант ${index + 1} повинен мати зображення та розміри`);
        }

        return {...color, catalogColorIds};
    });
    const existingIds = normalized.flatMap((color) => color.id === undefined ? [] : [color.id]);

    if (new Set(existingIds).size !== existingIds.length) {
        throw new ProductRequestError("Варіанти кольору не повинні дублюватися");
    }

    return normalized;
};

export const normalizeSpecificationOverrides = (
    overrides: ProductSpecificationOverrideRequest[],
): ProductSpecificationOverrideRequest[] => {
    const specificationIds = overrides.map(({categorySpecificationId}) => categorySpecificationId);

    if (new Set(specificationIds).size !== specificationIds.length) {
        throw new ProductRequestError("Характеристики для перевизначення не повинні дублюватися");
    }

    return overrides.filter(({value}) => value.length > 0);
};
