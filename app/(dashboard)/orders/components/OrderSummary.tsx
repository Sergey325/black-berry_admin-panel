import React from "react";
import {useRouter} from "next/navigation";
import {IOrder} from "@/app/actions/getOrders";
import {OrderStatus} from "@prisma/client";
import toast from "react-hot-toast";
import {formatDateAndTime} from "@/app/utils/formatDate";
import axios from "axios";
import Dropdown from "@/app/components/DropDown";
import {FiCopy} from "react-icons/fi";

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

    const statusOptions = orderStatuses.map((option) => ({
        ...option,
        onClick: () => onChangeStatus(option.value),
    }));

    const onChangeStatus  = async (status: string) => {
        await axios.patch(`/api/order/${order.id}`, {
            status: status,
        })
        .then(()=> {
            router.refresh()
            toast.success("Статус оновлено!")
        })
        .catch((error) => {
            toast.error(error?.response?.data?.error)
        });
    }

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
    };

    return (
        <aside className="self-start rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-900">
            <h2 className="font-semibold">
                Підсумок замовлення
            </h2>

            <div className="mt-5 space-y-4 text-base">
                <div className="flex items-start justify-between gap-4">
                    <span className="text-gray-600">Створено</span>
                    <span className="text-right font-medium text-gray-800">{formatDateAndTime(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <p className="text-gray-600">Статус</p>
                    <Dropdown options={statusOptions} defaultValue={order.status} buttonClassName="py-1.5! px-3!" className="max-w-[160px]"/>
                </div>
                <div className="flex items-start justify-between gap-4">
                    <span className="text-gray-600">Спосіб оплати</span>
                    <span className="max-w-[60%] text-right font-medium text-gray-800">{order.paymentMethod === "CASH_ON_DELIVERY" ? "Післяплата" : "Повна оплата картою"}</span>
                </div>
                {
                    order.ttnNumber && (
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-600">ТТН</span>
                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-gray-800 transition hover:bg-gray-200"
                                onClick={() => {
                                    if(!order.ttnNumber) return
                                    copyToClipboard(order.ttnNumber)
                                    toast.success("ТТН скопійовано")
                                }}
                            >
                                {order.ttnNumber}
                                <FiCopy className="size-3.5 text-gray-500"/>
                            </button>
                        </div>
                    )
                }
                <div className="flex items-end justify-between gap-4 border-t border-gray-200 pt-4">
                    <div className="font-medium text-gray-700">Усього оплачено</div>
                    <span className="text-lg font-semibold text-gray-950">{order.totalAmount.toLocaleString("uk-UA")} грн</span>
                </div>
            </div>
        </aside>
    );
};

export default OrderSummary;
