"use server";

import prisma from "@/app/lib/prisma";

export interface IMaterial {
    id: number;
    name: string,
}

export async function getMaterials() {
    try {
        const materials = await prisma.material.findMany();

        return materials;
    } catch (error) {
        console.error("Failed to get materials:", error);

        throw new Error("Failed to get materials");
    }
}