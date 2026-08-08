import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { isAdminRequest, normalizeDateOnly, unauthorizedResponse } from "@/app/lib/adminApi";

interface ExpensePatchBody {
    amount?: unknown;
    description?: unknown;
    year?: unknown;
    month?: unknown;
    expenseDate?: unknown;
}

interface Params {
    id: string;
}

function parseId(value: string) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
    if (!await isAdminRequest(request)) return unauthorizedResponse();

    const id = parseId((await params).id);
    if (!id) return NextResponse.json({ error: "Некоректний ідентифікатор" }, { status: 400 });

    try {
        const body = await request.json() as ExpensePatchBody;

        if (body.year !== undefined || body.month !== undefined) {
            return NextResponse.json({ error: "Місяць витрати змінювати не можна" }, { status: 400 });
        }

        const hasAmount = body.amount !== undefined;
        const hasDescription = body.description !== undefined;
        const hasExpenseDate = body.expenseDate !== undefined;
        const expenseDate = hasExpenseDate ? normalizeDateOnly(body.expenseDate) : null;
        const validAmount = !hasAmount || (typeof body.amount === "number" && Number.isFinite(body.amount) && body.amount > 0);
        const validDescription = !hasDescription || body.description === null || (typeof body.description === "string" && body.description.trim().length <= 500);

        const existing = await prisma.monthlyExpense.findUnique({
            where: { id },
            select: { id: true, year: true, month: true },
        });
        if (!existing) return NextResponse.json({ error: "Витрату не знайдено" }, { status: 404 });

        const validExpenseDate = !hasExpenseDate || (expenseDate !== undefined && (expenseDate === null ||
            (expenseDate.getUTCFullYear() === existing.year && expenseDate.getUTCMonth() + 1 === existing.month)));

        if ((!hasAmount && !hasDescription && !hasExpenseDate) || !validAmount || !validDescription || !validExpenseDate) {
            return NextResponse.json({ error: "Вкажіть коректні дату, суму або опис" }, { status: 400 });
        }

        const expense = await prisma.monthlyExpense.update({
            where: { id },
            data: {
                updatedAt: new Date(),
                ...(hasAmount ? { amount: body.amount as number } : {}),
                ...(hasDescription ? {
                    description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
                } : {}),
                ...(hasExpenseDate ? { expenseDate: expenseDate ?? null } : {}),
            },
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error("Failed to update expense", error);
        return NextResponse.json({ error: "Не вдалося оновити витрату" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
    if (!await isAdminRequest(request)) return unauthorizedResponse();

    const id = parseId((await params).id);
    if (!id) return NextResponse.json({ error: "Некоректний ідентифікатор" }, { status: 400 });

    try {
        const result = await prisma.monthlyExpense.deleteMany({ where: { id } });
        if (result.count === 0) return NextResponse.json({ error: "Витрату не знайдено" }, { status: 404 });
        return NextResponse.json(null, { status: 200 });
    } catch (error) {
        console.error("Failed to delete expense", error);
        return NextResponse.json({ error: "Не вдалося видалити витрату" }, { status: 500 });
    }
}
