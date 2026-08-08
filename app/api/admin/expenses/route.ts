import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getMonthPeriods, isAdminRequest, normalizeDateOnly, parseMonthRange, unauthorizedResponse } from "@/app/lib/adminApi";

interface ExpenseBody {
    year?: unknown;
    month?: unknown;
    amount?: unknown;
    description?: unknown;
    expenseDate?: unknown;
}

function normalizeDescription(value: unknown) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string" || value.trim().length > 500) return undefined;
    return value.trim();
}

export async function GET(request: NextRequest) {
    if (!await isAdminRequest(request)) return unauthorizedResponse();

    const range = parseMonthRange(request.nextUrl.searchParams);
    if (!range) {
        return NextResponse.json({ error: "Вкажіть коректний діапазон до 12 місяців" }, { status: 400 });
    }

    try {
        const expenses = await prisma.monthlyExpense.findMany({
            where: { OR: getMonthPeriods(range) },
            orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        });
        return NextResponse.json(expenses);
    } catch (error) {
        console.error("Failed to load expenses", error);
        return NextResponse.json({ error: "Не вдалося завантажити витрати" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (!await isAdminRequest(request)) return unauthorizedResponse();

    try {
        const body = await request.json() as ExpenseBody;
        const description = normalizeDescription(body.description);
        const expenseDate = normalizeDateOnly(body.expenseDate);

        if (!Number.isInteger(body.year) || Number(body.year) < 2020 || Number(body.year) > 2100 ||
            !Number.isInteger(body.month) || Number(body.month) < 1 || Number(body.month) > 12 ||
            typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0 ||
            description === undefined || expenseDate === undefined ||
            (expenseDate !== null && (expenseDate.getUTCFullYear() !== body.year || expenseDate.getUTCMonth() + 1 !== body.month))) {
            return NextResponse.json({ error: "Перевірте дату, місяць, суму та опис" }, { status: 400 });
        }

        const expense = await prisma.monthlyExpense.create({
            data: {
                year: Number(body.year),
                month: Number(body.month),
                amount: body.amount,
                description,
                expenseDate,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error("Failed to create expense", error);
        return NextResponse.json({ error: "Не вдалося додати витрату" }, { status: 500 });
    }
}
