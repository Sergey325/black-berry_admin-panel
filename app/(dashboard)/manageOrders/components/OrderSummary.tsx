import React from "react";
import {useRouter} from "next/navigation";
import {IOrder} from "@/app/actions/getOrders";
import {OrderStatus} from "@prisma/client";
import toast from "react-hot-toast";
import {formatDate} from "@/app/utils/formatDate";
import axios from "axios";
import DropDown from "@/app/(dashboard)/components/DropDown";

type Props = {
    order: IOrder
};

type StatusOption = {
    value: OrderStatus;
    label: string;
};

export const orderStatuses: StatusOption[] = [
    {
        value: OrderStatus.PENDING,
        label: "Створено",
    },
    {
        value: OrderStatus.PAID,
        label: "Оплачено",
    },
    {
        value: OrderStatus.PROCESSING,
        label: "В обробці",
    },
    {
        value: OrderStatus.SHIPPED,
        label: "Відправлено",
    },
    {
        value: OrderStatus.DELIVERED,
        label: "Доставлено",
    },
    {
        value: OrderStatus.CANCELLED,
        label: "Відмінено",
    },
    {
        value: OrderStatus.REFUNDED,
        label: "Повернено",
    },
];

const OrderSummary = ({order}: Props) => {
    const router = useRouter()

    const onChangeStatus  = async (status: string) => {
        await axios.patch(`/api/order/${order.id}`, {
            status: status,
        })
        .then(()=> {
            router.refresh()
        })
        .catch((error) => {
            toast.error(error?.response?.data?.error)
        });
    }

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
    };

    return (
        <div
            className="rounded-lg p-2 sm:p-4 lg:col-span-5 w-full xl:w-[30%] bg-gray-200 text-gray-900 self-start my-auto"
        >
            <h2 className="text-base md:text-xl font-medium ">
                Підсумок замовлення
            </h2>

            <div className="mt-6 space-y-4 text-sx sm:text-base">
                <div className="flex justify-between items-center">
                    <span className="font-light text-gray-800 max-w-[60%]">Створено о</span>
                    <span className="text-gray-800 text-right font-semibold">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <p className="font-light text-gray-800 max-w-[60%]">Статус</p>
                    <div className="max-w-[180px]">
                        <DropDown currentValue={order.status} options={orderStatuses} handleChange={onChangeStatus}/>
                    </div>
                    {/*<select*/}
                    {/*    value={order.status}*/}
                    {/*    onChange={(e) => {*/}
                    {/*        const status = e.target.value as OrderStatus;*/}
                    {/*        onChangeStatus(status);*/}
                    {/*    }}*/}
                    {/*    className="border border-gray-200 rounded-sm px-3 py-2 text-base outline-none focus:border-gray-400 transition bg-white w-full max-w-[180px] font-semibold"*/}
                    {/*>*/}
                    {/*    {orderStatuses.map((opt, index) => (*/}
                    {/*        <option key={index + order.id} value={opt.value} className="p-5">*/}
                    {/*            {opt.label}*/}
                    {/*        </option>*/}
                    {/*    ))}*/}
                    {/*</select>*/}
                </div>
                <div className="flex justify-between">
                    <span className="font-light text-gray-800 max-w-[60%]">Спосіб оплати</span>
                    <span className="text-gray-900 font-semibold text-right">{order.paymentMethod === "CASH_ON_DELIVERY" ? "Післяплата" : "Повна оплата картою"}</span>
                </div>
                {
                    order.ttnNumber && (
                        <div className="flex justify-between">
                            <span className="text-gray-800 max-w-[60%]">ТТН</span>
                            <span
                                className="text-gray-800 cursor-pointer select-none font-semibold"
                                onClick={() => {
                                    if(!order.ttnNumber) return
                                    copyToClipboard(order.ttnNumber)
                                    toast.success("ТТН скопійовано")
                                }}
                            >
                                {order.ttnNumber}
                            </span>
                        </div>
                    )
                }
                <div className="flex items-center justify-between border-t border-gray-800 pt-4 text-base sm:text-lg">
                    <div className="text-base font-medium">Усього</div>
                    <span className="text-base lg:text-xl text-gray-800 font-semibold">{order.totalAmount} грн</span>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;