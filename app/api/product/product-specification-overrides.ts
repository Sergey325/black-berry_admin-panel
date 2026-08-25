import {Prisma} from "@prisma/client";
import {
    ProductRequestError,
    type ProductSpecificationOverrideRequest,
} from "@/app/api/product/product-request";

export const reconcileSpecificationOverrides = async (
    transaction: Prisma.TransactionClient,
    productId: number,
    categoryId: number | null,
    requestedOverrides: ProductSpecificationOverrideRequest[],
    hasExistingOverrides: boolean,
): Promise<void> => {
    if (categoryId === null) {
        if (requestedOverrides.length > 0) {
            throw new ProductRequestError("Неможливо перевизначити характеристику товару без категорії");
        }

        if (hasExistingOverrides) {
            await transaction.productSpecificationOverride.deleteMany({where: {productId}});
        }

        return;
    }

    const requestedSpecificationIds = requestedOverrides.map(({categorySpecificationId}) => categorySpecificationId);
    const categorySpecifications = requestedSpecificationIds.length === 0
        ? []
        : await transaction.categorySpecification.findMany({
            where: {
                categoryId,
                id: {in: requestedSpecificationIds},
            },
            select: {
                id: true,
                value: true,
            },
        });

    if (categorySpecifications.length !== requestedSpecificationIds.length) {
        throw new ProductRequestError("Одна або кілька характеристик не належать вибраній категорії");
    }

    const defaultValues = new Map(categorySpecifications.map(({id, value}) => [id, value]));
    const overrides = requestedOverrides.filter((override) => (
        override.value !== defaultValues.get(override.categorySpecificationId)
    ));
    const retainedSpecificationIds = overrides.map(({categorySpecificationId}) => categorySpecificationId);

    if (hasExistingOverrides) {
        const deleteWhere: Prisma.ProductSpecificationOverrideWhereInput = {productId};

        if (retainedSpecificationIds.length > 0) {
            deleteWhere.categorySpecificationId = {notIn: retainedSpecificationIds};
        }

        await transaction.productSpecificationOverride.deleteMany({where: deleteWhere});
    }

    for (const override of overrides) {
        await transaction.productSpecificationOverride.upsert({
            where: {
                productId_categorySpecificationId: {
                    productId,
                    categorySpecificationId: override.categorySpecificationId,
                },
            },
            update: {value: override.value},
            create: {
                productId,
                categorySpecificationId: override.categorySpecificationId,
                value: override.value,
            },
        });
    }
};
