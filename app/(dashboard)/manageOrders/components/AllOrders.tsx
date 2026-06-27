import {IOrder} from "@/app/actions/getOrders";
import {orderStatuses} from "@/app/(dashboard)/manageOrders/components/OrderSummary";
import {useCallback, useMemo} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import qs from "query-string";
import DropDown from "@/app/(dashboard)/components/DropDown";
import {CiCirclePlus} from "react-icons/ci";
import ToolTip from "@/app/components/ToolTip";
import {formatDate} from "@/app/utils/formatDate";
import OrderCard from "@/app/(dashboard)/manageOrders/components/OrderCard";

type Props = {
    orders: IOrder[],
    handleChangeTab: (tab: string) => void
};

const profitStatuses = [
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
];

const AllOrders = ({orders, handleChangeTab}: Props) => {
    const params = useSearchParams()
    const router = useRouter()

    const status = useMemo(() => {
        return params?.get("status") || "All";
    }, [params])

    const handleChangeStatusFilter = useCallback((statusValue: string) => {
        let currentQuery = {}

        if (status === statusValue) return null

        if(params){
            currentQuery = qs.parse(params.toString())
        }

        const updatedQuery: any = {
            ...currentQuery,
            status: statusValue
        }

        const url = qs.stringifyUrl({
            url: 'manageOrders/',
            query: updatedQuery
        }, {skipNull: true})

        router.push(url)
    }, [params])

    if (orders?.length === 0) {
        return (
            <div className="flex flex-col gap-5 items-center">
                <p className="mt-4 text-center text-lg">
                    Замовлень із вказаним статусом не знайдено
                </p>
                <button
                    className="border rounded-md h-8 px-3 cursor-pointer bg-gray-100 hover:shadow-[0_0_0_2px_rgba(100,116,139,1)] transition"
                    onClick={() => router.push("/manageOrders")}
                >
                    Скинути фільтр
                </button>
            </div>

        )
    }

    const groupedOrders = Object.entries(
        orders.reduce((acc, order) => {
            const date = formatDate(order.createdAt); // например "22 червня 2026"

            if (!acc[date]) {
                acc[date] = [];
            }

            acc[date].push(order);

            return acc;
        }, {} as Record<string, typeof orders>)
    );

    return (
        <div className="flex flex-col gap-3 md:gap-6 text-2xl md:text-4xl py-5 px-3">
            <div className="w-full flex gap-4 items-center">
                <DropDown
                    options={[
                        {
                            value: "",
                            label: "Усі",
                        },
                        ...orderStatuses,
                    ]}
                    currentValue={status}
                    handleChange={handleChangeStatusFilter}
                />
                <ToolTip label="Додати замовлення">
                    <CiCirclePlus
                        className="size-8 text-gray-400 hover:text-gray-800 cursor-pointer transition bg-white rounded-full"
                        onClick={() => handleChangeTab("AddOrder")}
                    />
                </ToolTip>
            </div>
            {groupedOrders.map(([date, orders]) => {
                const totalProfit = orders
                    .filter(order => profitStatuses.includes(order.status))
                    .reduce((sum, order) => sum + order.totalAmount, 0);

                return (
                    <div key={date} className="space-y-6">

                        <div className="flex items-center gap-4 py-2">
                            <hr className="flex-1 lg:border-2 border-gray-950" />

                            <div className="lg:px-2 text-center whitespace-nowrap">
                                <div className="font-semibold text-lg lg:text-xl">
                                    {date}
                                </div>
                                <div className="text-base text-gray-600">
                                    {orders.length} замовлень • {totalProfit} грн
                                </div>
                            </div>

                            <hr className="flex-1 border-gray-950 lg:border-2" />
                        </div>

                        {orders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

export default AllOrders;