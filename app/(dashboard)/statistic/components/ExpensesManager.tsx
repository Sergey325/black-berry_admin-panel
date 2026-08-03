"use client";

import {FormEvent, useState} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {FiCheck, FiEdit2, FiPlus, FiTrash2, FiX} from "react-icons/fi";
import {formatCurrency} from "@/app/(dashboard)/statistic/utils";
import {MonthlyExpense} from "@/app/types";

interface Props {
    expenses: MonthlyExpense[];
    year: number;
    month: number;
    onChanged: () => Promise<void>;
}

function getErrorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError<{ error?: string }>(error)) {
        return error.response?.data?.error ?? fallback;
    }
    return fallback;
}

export default function ExpensesManager({expenses, year, month, onChanged}: Props) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editAmount, setEditAmount] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [saving, setSaving] = useState(false);

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
                year,
                month,
                amount: parsedAmount,
                description: description.trim() || undefined,
            });
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
            <h2 className="text-lg font-semibold">Витрати за місяць</h2>
            <form onSubmit={addExpense} className="mt-4 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto]">
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
                    className="hidden grid-cols-[minmax(0,1fr)_180px_110px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 md:grid">
                    <span>Опис</span>
                    <span className="text-right">Сума</span>
                    <span className="text-center">Дії</span>
                </div>
                {expenses.length === 0 ? (
                    <p className="py-8 text-center text-gray-400">Витрат за цей місяць немає</p>
                ) : expenses.map((expense) => (
                    <div key={expense.id}
                         className="grid gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_180px_110px] md:items-center">
                        {editingId === expense.id ? (
                            <>
                                <input value={editDescription}
                                       onChange={(event) => setEditDescription(event.target.value)} maxLength={500}
                                       className="px-3 py-2"/>
                                <input value={editAmount} onChange={(event) => setEditAmount(event.target.value)}
                                       inputMode="decimal" className="px-3 py-2 md:text-right"/>
                                <div className="flex justify-end gap-2 md:justify-center">
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() => updateExpense(expense.id)}
                                        aria-label="Зберегти"
                                        className="p-2 text-emerald-600 hover:text-emerald-800">
                                        <FiCheck className={"size-5"} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() => setEditingId(null)}
                                        aria-label="Скасувати"
                                        className="p-2 text-gray-500 hover:text-red-600"
                                    >
                                        <FiX className={"size-5"} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="break-words text-gray-700">{expense.description || "Без опису"}</span>
                                <span className="font-medium md:text-right">{formatCurrency(expense.amount)}</span>
                                <div className="flex justify-end gap-2 md:justify-center">
                                    <button type="button" disabled={saving} onClick={() => startEditing(expense)}
                                            aria-label="Редагувати" className="p-2 text-gray-500 hover:text-gray-900"
                                    >
                                        <FiEdit2 className={"size-5"} />
                                    </button>
                                    <button type="button" disabled={saving} onClick={() => deleteExpense(expense.id)}
                                            aria-label="Видалити" className="p-2 text-gray-500 hover:text-red-600"
                                    >
                                        <FiTrash2 className={"size-5"} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
