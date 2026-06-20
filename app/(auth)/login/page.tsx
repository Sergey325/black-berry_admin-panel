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
            router.replace("/");
            router.refresh();
        } catch {
            setError("Невірний пароль");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-md p-8 w-full max-w-sm flex flex-col gap-4">
                <h1 className="text-xl font-semibold text-center text-red">Вхід в Адмін-панель</h1>

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    className="border border-gray-200 rounded-sm px-3 py-2 outline-none focus:border-gray-400 transition"
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button type="submit" className="bg-black text-white rounded-sm py-2 hover:bg-gray-800 transition">
                    Увійти
                </button>
            </form>
        </div>
    );
}