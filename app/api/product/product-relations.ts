import {Prisma} from "@prisma/client";

export const existingRelationSelect = {
    id: true,
    toProductId: true,
    order: true,
} satisfies Prisma.ProductRelationSelect;

export type ExistingRelation = Prisma.ProductRelationGetPayload<{
    select: typeof existingRelationSelect;
}>;

export const reconcileRelations = async (
    transaction: Prisma.TransactionClient,
    productId: number,
    requestedRelatedIds: number[],
    existingRelations: ExistingRelation[],
): Promise<void> => {
    const existingRelationsByProductId = new Map(existingRelations.map((relation) => [relation.toProductId, relation]));
    const retainedIds = new Set<number>();
    const relationsToCreate: Prisma.ProductRelationCreateManyInput[] = [];
    const relationsToReorder: {id: number; order: number}[] = [];

    requestedRelatedIds.forEach((toProductId, order) => {
        const existingRelation = existingRelationsByProductId.get(toProductId);

        if (!existingRelation) {
            relationsToCreate.push({fromProductId: productId, toProductId, order});
            return;
        }

        retainedIds.add(existingRelation.id);

        if (existingRelation.order !== order) {
            relationsToReorder.push({id: existingRelation.id, order});
        }
    });

    const removedIds = existingRelations.filter(({id}) => !retainedIds.has(id)).map(({id}) => id);

    if (removedIds.length > 0) {
        await transaction.productRelation.deleteMany({where: {id: {in: removedIds}, fromProductId: productId}});
    }

    if (relationsToCreate.length > 0) {
        await transaction.productRelation.createMany({data: relationsToCreate});
    }

    for (const relation of relationsToReorder) {
        await transaction.productRelation.update({
            where: {id: relation.id},
            data: {order: relation.order},
        });
    }
};
