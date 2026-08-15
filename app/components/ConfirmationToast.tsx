"use client";

import {useState} from "react";
import toast, {Toast} from "react-hot-toast";

type ConfirmationToastOptions = {
    toastId: string;
    message: string;
    onConfirmAction: () => void | Promise<void>;
};

type ConfirmationToastProps = Omit<ConfirmationToastOptions, "toastId"> & {
    toastInstance: Toast;
};

function ConfirmationToast({message, onConfirmAction, toastInstance}: ConfirmationToastProps) {
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirmAction();
            toast.dismiss(toastInstance.id);
        } catch {
            setIsConfirming(false);
        }
    };

    return (
        <div className={`${toastInstance.visible ? "confirmation-toast-enter" : "confirmation-toast-exit"} w-[min(360px,calc(100vw-32px))] rounded-xl border border-slate-300 bg-white p-4 shadow-2xl shadow-black/25`}>
            <p className="font-medium text-gray-900">{message}</p>
            <div className="mt-3 flex justify-end gap-2">
                <button
                    type="button"
                    disabled={isConfirming}
                    onClick={() => toast.dismiss(toastInstance.id)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                >
                    Скасувати
                </button>
                <button
                    type="button"
                    disabled={isConfirming}
                    onClick={handleConfirm}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                    {isConfirming ? "Видалення…" : "Видалити"}
                </button>
            </div>
        </div>
    );
}

export function showConfirmationToast({toastId, ...options}: ConfirmationToastOptions) {
    return toast.custom(
        (toastInstance) => <ConfirmationToast {...options} toastInstance={toastInstance}/>,
        {id: toastId, duration: Infinity},
    );
}
