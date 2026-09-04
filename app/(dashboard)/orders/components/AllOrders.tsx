import {IOrder} from "@/app/actions/getOrders";
import {orderStatuses} from "@/app/(dashboard)/orders/components/OrderSummary";
import {useCallback, useMemo} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import qs from "query-string";
import {FiPlus} from "react-icons/fi";
import {formatDate} from "@/app/utils/formatDate";
import OrderCard from "@/app/(dashboard)/orders/components/OrderCard";
import Dropdown from "@/app/components/DropDown";
import {pluralizeUk} from "@/app/utils/pluralizeUk";
import SearchInput from "@/app/components/SearchInput";

type Props = {
    orders: IOrder[],
    onAdd: () => void;
    onEdit: (order: IOrder) => void;
};

const profitStatuses = [
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "ARRIVED",
    "DELIVERED",
];

const AllOrders = ({orders, onAdd, onEdit}: Props) => {
    const params = useSearchParams()
    const router = useRouter()

    const status = useMemo(() => {
        return params?.get("status") || "All";
    }, [params])
    const hasSearch = Boolean(params.get("search")?.trim());

    const statusOptions = orderStatuses.map((option) => ({
        ...option,
        onClick: () => handleChangeStatusFilter(option.value),
    }));

    const handleChangeStatusFilter = useCallback((statusValue: string) => {
        let currentQuery = {}

        if (status === statusValue) return null

        if(params){
            currentQuery = qs.parse(params.toString())
        }

        const updatedQuery = {
            ...currentQuery,
            status: statusValue
        }

        const url = qs.stringifyUrl({
            url: '/orders',
            query: updatedQuery
        }, {skipNull: true})

        router.push(url)
    }, [params, router, status])

    const groupedOrders = Object.entries(
        orders.reduce((acc, order) => {
            const date = formatDate(order.createdAt);

            if (!acc[date]) {
                acc[date] = [];
            }

            acc[date].push(order);

            return acc;
        }, {} as Record<string, typeof orders>)
    );

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full items-center gap-3 lg:min-w-fit">
                    <SearchInput
                        searchParam="search"
                        placeholder="Пошук за №, прізвищем, телефоном або email..."
                    />
                    <button
                        type="button"
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-black px-3 text-sm font-medium text-white transition hover:bg-gray-800 sm:px-4"
                        onClick={onAdd}
                    >
                        <FiPlus className="size-5"/>
                        <span className="hidden sm:inline">Додати замовлення</span>
                    </button>
                </div>
                <div className="w-full lg:w-fit">
                    <Dropdown
                        options={[
                            {
                                value: "All",
                                label: "Усі",
                                onClick:function() {handleChangeStatusFilter("All")}
                            },
                            ...statusOptions,
                        ]}
                        defaultValue={status}
                        buttonClassName="lg:min-w-[220px]"
                    />
                </div>
            </div>
            {orders.length === 0 && (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-center shadow-sm">
                    <p className="font-medium text-gray-700">
                        {hasSearch ? "Замовлень за вашим запитом не знайдено" : "Замовлень із вказаним статусом не знайдено"}
                    </p>
                    <p className="mt-1 text-base text-gray-600">
                        {hasSearch ? "Перевірте запит або змініть фільтр" : "Спробуйте обрати інший статус"}
                    </p>
                    {!hasSearch && status !== "All" && (
                        <button type="button" className="mt-5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50" onClick={() => router.push("/orders")}>Скинути фільтр</button>
                    )}
                </div>
            )}
            {groupedOrders.map(([date, orders]) => {
                const totalProfit = orders
                    .filter(order => profitStatuses.includes(order.status))
                    .reduce((sum, order) => sum + order.totalAmount, 0);

                return (
                    <section key={date} className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-gray-200" />
                            <div className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-center shadow-sm">
                                <div className="text-base font-semibold text-gray-900">
                                    {date}
                                </div>
                                <div className="mt-0.5 text-sm text-gray-600">
                                    {orders.length} {pluralizeUk(orders.length, ["замовлення", "замовлення", "замовлень"])} · {totalProfit.toLocaleString("uk-UA")} грн
                                </div>
                            </div>
                            <div className="h-px flex-1 bg-gray-200" />
                        </div>
                        <div className="space-y-3">
                            {orders.map(order => <OrderCard key={order.id} order={order} onEdit={onEdit}/>) }
                        </div>
                    </section>
                );
            })}
        </div>
    );
};

export default AllOrders;
