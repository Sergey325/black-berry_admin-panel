interface StatusItem {
    status: string;
    count: number;
}

interface Props {
    data: StatusItem[];
}

const statusLabels: Record<string, string> = {
    PENDING: "Очікує оплати",
    PAID: "Оплачено",
    PROCESSING: "В обробці",
    SHIPPED: "Відправлено",
    ARRIVED: "Доставлено",
    DELIVERED: "Отримано",
    CANCELLED: "Скасовано",
    REFUNDED: "Повернено",
};

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-400",
    PAID: "bg-sky-500",
    PROCESSING: "bg-violet-500",
    SHIPPED: "bg-indigo-500",
    ARRIVED: "bg-teal-500",
    DELIVERED: "bg-emerald-500",
    CANCELLED: "bg-gray-400",
    REFUNDED: "bg-red-500",
};

export default function StatusBreakdown({ data }: Props) {
    const total = data.reduce((sum, item) => sum + item.count, 0);

    if (total === 0) {
        return <p className="py-12 text-center text-gray-400">Замовлень за цей період ще немає</p>;
    }

    return (
        <div className="space-y-4">
            {data.map((item) => (
                <div key={item.status}>
                    <div className="mb-1.5 flex justify-between gap-3 text-sm">
                        <span>{statusLabels[item.status] ?? item.status}</span>
                        <span className="text-gray-500">{item.count}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                            className={`h-full rounded-full ${statusColors[item.status] ?? "bg-primary"}`}
                            style={{ width: `${(item.count / total) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
