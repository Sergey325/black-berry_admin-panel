"use client";

import {useState} from "react";
import toast, {Toast} from "react-hot-toast";

type ConfirmationToastOptions = {
    toastId: string;
    message: string;
    onConfirmAction: () => void | Promise<void>;
    onCancelAction?: () => void | Promise<void>;
    confirmLabel?: string;
    cancelLabel?: string;
    pendingLabel?: string;
    variant?: "danger" | "primary";
};

type ConfirmationToastProps = Omit<ConfirmationToastOptions, "toastId"> & {
    toastInstance: Toast;
};

function ConfirmationToast({
    message,
    onConfirmAction,
    onCancelAction,
    confirmLabel = "Видалити",
    cancelLabel = "Скасувати",
    pendingLabel = "Видалення…",
    variant = "danger",
    toastInstance,
}: ConfirmationToastProps) {
    const [pendingAction, setPendingAction] = useState<"confirm" | "cancel" | null>(null);

    const handleConfirm = async () => {
        setPendingAction("confirm");
        try {
            await onConfirmAction();
            toast.dismiss(toastInstance.id);
        } catch {
            setPendingAction(null);
        }
    };

    const handleCancel = async () => {
        if (!onCancelAction) {
            toast.dismiss(toastInstance.id);
            return;
        }

        setPendingAction("cancel");
        try {
            await onCancelAction();
            toast.dismiss(toastInstance.id);
        } catch {
            setPendingAction(null);
        }
    };

    const confirmButtonClassName = variant === "primary"
        ? "bg-black text-white hover:bg-gray-800"
        : "bg-red-600 text-white hover:bg-red-700";

    return (
        <div className={`${toastInstance.visible ? "confirmation-toast-enter" : "confirmation-toast-exit"} w-[min(360px,calc(100vw-32px))] rounded-xl border border-slate-300 bg-white p-4 shadow-2xl shadow-black/25`}>
            <p className="font-medium text-gray-900">{message}</p>
            <div className="mt-3 flex justify-end gap-2">
                <button
                    type="button"
                    disabled={pendingAction !== null}
                    onClick={handleCancel}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                >
                    {pendingAction === "cancel" ? pendingLabel : cancelLabel}
                </button>
                <button
                    type="button"
                    disabled={pendingAction !== null}
                    onClick={handleConfirm}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${confirmButtonClassName}`}
                >
                    {pendingAction === "confirm" ? pendingLabel : confirmLabel}
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
