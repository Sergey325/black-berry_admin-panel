import {IOrder, IOrderItem} from "@/app/actions/getOrders";
import OrderItem from "@/app/(dashboard)/manageOrders/components/OrderItem";
import OrderSummary, {orderStatuses} from "@/app/(dashboard)/manageOrders/components/OrderSummary";
import {useCallback, useMemo} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import qs from "query-string";
import DropDown from "@/app/(dashboard)/components/DropDown";
import {CiCirclePlus} from "react-icons/ci";
import ToolTip from "@/app/components/ToolTip";

type Props = {
    orders: IOrder[],
    handleChangeTab: (tab: string) => void
    onEdit: (order: IOrder) => void
};

const AllOrders = ({orders, handleChangeTab, onEdit}: Props) => {
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
            {(orders)?.map((order) => {
                return (
                    <div key={order.id}
                         className="text-base lg:text-lg py-5 md:py-10 px-5 text-gray-700 rounded-xl border-2 border-gray-500 bg-white">
                        <div className="flex flex-col md:flex-row justify-between gap-1 sm:gap-0">
                            <div className="space-y-1.5">
                                <p className="">{`Замовлення: ${order.invoiceId}`}</p>
                                <p className="">{`Місто: ${order.city}, ${order.area} обл.`}</p>
                                <p className="">{`${order.warehouse}`}</p>
                            </div>
                            <div className="space-y-1.5 text-left md:text-right">
                                <p className="">{`Ім'я: ${order.firstName} ${order.lastName}`}</p>
                                <p className="">{`Телефон: ${order.phone}`}</p>
                                {order.email && <p className="">{`Email: ${order.email}`}</p>}
                            </div>
                        </div>
                        <div className="flex flex-col xl:flex-row gap-5 xl:gap-20 pt-2 items-stretch h-full">
                            <div className="flex flex-col w-full xl:w-4/6 gap-3">
                                <hr className="hidden sm:inline-block border-gray-500 w-full"/>
                                <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 text-base">
                                    <span className="font-semibold">Товар</span>
                                    <span className="hidden md:inline-block md:w-[18%] justify-self-end lg:text-center -mr-[28%] font-semibold">Ціна</span>
                                    <span className="md:w-[18%] justify-self-end text-center font-semibold">Кількість</span>
                                    <span className=" justify-self-end text-right font-semibold">Усього</span>
                                </div>
                                {(order.items).map(orderItem => (
                                    <div key={orderItem.id} className="flex flex-col gap-2 h-full">
                                        <hr className="border-gray-500 w-full"/>
                                        <div className="flex flex-col justify-between h-full">
                                            <OrderItem orderItem={orderItem}/>
                                        </div>
                                    </div>
                                ))}
                                {   order.comment && (
                                    <div
                                        className="flex flex-col gap-1 rounded-lg border border-gray-300 p-3 justify-self-end">
                                        <span className="text-sm">Коментар:</span>
                                        <p className="wrap-break-word">
                                            {order.comment}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <OrderSummary order={order}/>
                        </div>
                    </div>)
            })}

        </div>
    );
};

export default AllOrders;