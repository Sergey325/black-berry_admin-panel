"use client";

import {FormEvent, useState} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {FiCheck, FiPlus, FiTrash2, FiX} from "react-icons/fi";
import {formatCurrency} from "@/app/(dashboard)/statistic/utils";
import {MonthlyExpense} from "@/app/types";
import {formatMonthPeriod, parseMonthPeriod} from "@/app/lib/adminApi";
import type {MonthRange} from "@/app/lib/adminApi";
import ToolTip from "@/app/components/ToolTip";
import {MdEdit} from "react-icons/md";

interface Props {
    expenses: MonthlyExpense[];
    range: MonthRange;
    onChanged: () => Promise<void>;
}

function getErrorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError<{ error?: string }>(error)) {
        return error.response?.data?.error ?? fallback;
    }
    return fallback;
}

function formatDateInput(year: number, month: number, day: number) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatExpenseDate(expense: MonthlyExpense) {
    if (!expense.expenseDate) return `${String(expense.month).padStart(2, "0")}.${expense.year} (місяць)`;
    const [year, month, day] = expense.expenseDate.slice(0, 10).split("-");
    return `${day}.${month}.${year}`;
}

export default function ExpensesManager({expenses, range, onChanged}: Props) {
    const [expenseMonth, setExpenseMonth] = useState(formatMonthPeriod(range.to));
    const [expenseDate, setExpenseDate] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editExpenseDate, setEditExpenseDate] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const selectedPeriod = parseMonthPeriod(expenseMonth) ?? range.to;
    const minimumDate = formatDateInput(selectedPeriod.year, selectedPeriod.month, 1);
    const maximumDate = formatDateInput(selectedPeriod.year, selectedPeriod.month, new Date(selectedPeriod.year, selectedPeriod.month, 0).getDate());

    const addExpense = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const parsedAmount = Number(amount.replace(",", "."));
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            toast.error("Вкажіть коректну суму");
            return;
        }

        setSaving(true);
        try {
            await axios.post("/api/admin/expenses", {
                year: selectedPeriod.year,
                month: selectedPeriod.month,
                amount: parsedAmount,
                description: description.trim() || undefined,
                expenseDate: expenseDate || null,
            });
            setExpenseDate("");
            setAmount("");
            setDescription("");
            await onChanged();
            toast.success("Витрату додано");
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Не вдалося додати витрату"));
        } finally {
            setSaving(false);
        }
    };

    const startEditing = (expense: MonthlyExpense) => {
        setEditingId(expense.id);
        setEditExpenseDate(expense.expenseDate?.slice(0, 10) ?? "");
        setEditAmount(String(expense.amount));
        setEditDescription(expense.description ?? "");
    };

    const updateExpense = async (id: number) => {
        const parsedAmount = Number(editAmount.replace(",", "."));
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            toast.error("Вкажіть коректну суму");
            return;
        }

        setSaving(true);
        try {
            await axios.patch(`/api/admin/expenses/${id}`, {
                amount: parsedAmount,
                description: editDescription,
                expenseDate: editExpenseDate || null,
            });
            setEditingId(null);
            await onChanged();
            toast.success("Витрату оновлено");
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Не вдалося оновити витрату"));
        } finally {
            setSaving(false);
        }
    };

    const deleteExpense = async (id: number) => {
        if (!window.confirm("Видалити цю витрату?")) return;

        setSaving(true);
        try {
            await axios.delete(`/api/admin/expenses/${id}`);
            await onChanged();
            toast.success("Витрату видалено");
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Не вдалося видалити витрату"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-xl border border-gray-300 bg-white p-4 md:p-5">
            <h2 className="text-lg font-semibold">Витрати за період</h2>
            <form onSubmit={addExpense} className="mt-4 grid gap-3 md:grid-cols-[170px_160px_160px_minmax(0,1fr)_auto]">
                <input
                    type="month"
                    value={expenseMonth}
                    onChange={(event) => {
                        setExpenseMonth(event.target.value);
                        setExpenseDate("");
                    }}
                    min={formatMonthPeriod(range.from)}
                    max={formatMonthPeriod(range.to)}
                    aria-label="Місяць витрати"
                    className="w-full pl-3 pr-2 py-2 min-w-[170px]"
                    disabled={saving}
                    required
                />
                <input
                    type="date"
                    value={expenseDate}
                    onChange={(event) => setExpenseDate(event.target.value)}
                    min={minimumDate}
                    max={maximumDate}
                    aria-label="Дата витрати (необов’язково)"
                    className="w-full px-3 py-2"
                    disabled={saving}
                />
                <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder="Сума, ₴"
                    className="w-full px-3 py-2"
                    disabled={saving}
                />
                <input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Опис (необов’язково)"
                    maxLength={500}
                    className="w-full px-3 py-2"
                    disabled={saving}
                />
                <button type="submit" disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50">
                    <FiPlus/> Додати
                </button>
            </form>

            <div className="mt-5 overflow-hidden rounded-md border border-gray-200">
                <div
                    className="hidden grid-cols-[130px_minmax(0,1fr)_180px_110px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 md:grid">
                    <span>Дата</span>
                    <span>Опис</span>
                    <span className="text-right">Сума</span>
                    <span className="text-center">Дії</span>
                </div>
                {expenses.length === 0 ? (
                    <p className="py-8 text-center text-gray-400">Витрат за цей період немає</p>
                ) : expenses.map((expense) => (
                    <div key={expense.id}
                         className="grid gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0 md:grid-cols-[130px_minmax(0,1fr)_180px_110px] md:items-center">
                        {editingId === expense.id ? (
                            <>
                                <input
                                    type="date"
                                    value={editExpenseDate}
                                    onChange={(event) => setEditExpenseDate(event.target.value)}
                                    min={formatDateInput(expense.year, expense.month, 1)}
                                    max={formatDateInput(expense.year, expense.month, new Date(expense.year, expense.month, 0).getDate())}
                                    aria-label="Дата витрати (необов’язково)"
                                    className="px-3 py-2"
                                />
                                <input value={editDescription}
                                       onChange={(event) => setEditDescription(event.target.value)} maxLength={500}
                                       className="px-3 py-2"/>
                                <input value={editAmount} onChange={(event) => setEditAmount(event.target.value)}
                                       inputMode="decimal" className="px-3 py-2 md:text-right"/>
                                <div className="flex justify-end gap-2 md:justify-center">
                                    <ToolTip label="Зберегти">
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => updateExpense(expense.id)}
                                            aria-label="Зберегти"
                                            className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-emerald-50 hover:text-emerald-800">
                                            <FiCheck className={"size-5"} />
                                        </button>
                                    </ToolTip>
                                    <ToolTip label="Скасувати">
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => setEditingId(null)}
                                            aria-label="Скасувати"
                                            className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                                        >
                                            <FiX className={"size-5"} />
                                        </button>
                                    </ToolTip>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className={expense.expenseDate ? "text-gray-700" : "text-gray-400"}>
                                    {formatExpenseDate(expense)}
                                </span>
                                <span className="wrap-break-word text-gray-700">{expense.description || "Без опису"}</span>
                                <span className="font-medium md:text-right">{formatCurrency(expense.amount)}</span>
                                <div className="flex justify-end gap-2 md:justify-center">
                                    <ToolTip label="Редагувати">
                                        <button type="button" disabled={saving} onClick={() => startEditing(expense)} className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-blue-50 hover:text-blue-600" aria-label="Редагувати товар">
                                            <MdEdit className="size-5"/>
                                        </button>
                                    </ToolTip>
                                    <ToolTip label="Видалити">
                                        <button type="button" disabled={saving} onClick={() => deleteExpense(expense.id)} className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600" aria-label="Видалити товар">
                                            <FiTrash2 className="size-5"/>
                                        </button>
                                    </ToolTip>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
