import {randomUUID} from "node:crypto";
import type {Prisma} from "@prisma/client";

export type CategorySpecificationInput = {specificationId?: number; name: string; value: string};

export class CategorySpecificationError extends Error {}

export async function reconcileCategorySpecifications(
    transaction: Prisma.TransactionClient,
    categoryId: number,
    specifications: CategorySpecificationInput[],
) {
    const existing = await transaction.categorySpecification.findMany({where: {categoryId}});
    const ids = new Set(existing.map(({id}) => id));
    const resolved = specifications.map((specification) => ({
        ...specification,
        specificationId: specification.specificationId ?? existing.find(({name}) => name === specification.name)?.id,
    }));
    const retainedIds = resolved.flatMap(({specificationId}) => specificationId === undefined ? [] : [specificationId]);
    if (retainedIds.some((id) => !Number.isInteger(id) || !ids.has(id)) || new Set(retainedIds).size !== retainedIds.length) {
        throw new CategorySpecificationError("Характеристики змінилися. Оновіть сторінку");
    }
    await transaction.categorySpecification.deleteMany({where: {categoryId, id: {notIn: retainedIds}}});
    for (const specification of resolved) {
        if (specification.specificationId !== undefined && existing.find(({id}) => id === specification.specificationId)?.name !== specification.name) {
            await transaction.categorySpecification.update({
                where: {id: specification.specificationId},
                data: {name: randomUUID()},
            });
        }
    }
    for (const [order, {specificationId, name, value}] of resolved.entries()) {
        const data = {name, value, order};
        if (specificationId === undefined) {
            await transaction.categorySpecification.create({data: {...data, categoryId}});
        } else {
            await transaction.categorySpecification.update({where: {id: specificationId}, data});
        }
    }
}
