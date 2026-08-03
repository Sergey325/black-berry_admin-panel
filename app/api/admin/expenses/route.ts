import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { isAdminRequest, parseYearMonth, unauthorizedResponse } from "@/app/lib/adminApi";

interface ExpenseBody {
    year?: unknown;
    month?: unknown;
    amount?: unknown;
    description?: unknown;
}

function normalizeDescription(value: unknown) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string" || value.trim().length > 500) return undefined;
    return value.trim();
}

export async function GET(request: NextRequest) {
    if (!await isAdminRequest(request)) return unauthorizedResponse();

    const period = parseYearMonth(request.nextUrl.searchParams);
    if (!period) {
        return NextResponse.json({ error: "Вкажіть коректні рік і місяць" }, { status: 400 });
    }

    try {
        const expenses = await prisma.monthlyExpense.findMany({
            where: period,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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

        if (!Number.isInteger(body.year) || Number(body.year) < 2020 || Number(body.year) > 2100 ||
            !Number.isInteger(body.month) || Number(body.month) < 1 || Number(body.month) > 12 ||
            typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0 ||
            description === undefined) {
            return NextResponse.json({ error: "Перевірте рік, місяць, суму та опис" }, { status: 400 });
        }

        const expense = await prisma.monthlyExpense.create({
            data: {
                year: Number(body.year),
                month: Number(body.month),
                amount: body.amount,
                description,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error("Failed to create expense", error);
        return NextResponse.json({ error: "Не вдалося додати витрату" }, { status: 500 });
    }
}
