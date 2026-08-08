"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            await axios.post("/api/login", { password });
            router.replace("/products?tab=AllProducts");
            router.refresh();
        } catch {
            setError("Невірний пароль");
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
            <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex w-fit px-3 py-1 items-center justify-center rounded-xl bg-gray-950 text-lg font-semibold text-white">Black Berry</div>
                    <h1 className="text-xl font-semibold text-gray-900">Вхід в адмін-панель</h1>
                    <p className="mt-1 text-sm text-gray-500">Введіть пароль для продовження</p>
                </div>

                <label htmlFor="password" className="mb-1.5 text-sm font-medium text-gray-700">Пароль</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                />

                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

                <button type="submit" className="mt-5 rounded-lg bg-black py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
                    Увійти
                </button>
            </form>
        </main>
    );
}
