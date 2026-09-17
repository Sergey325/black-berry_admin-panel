import OrderSummary from "@/app/(dashboard)/orders/components/OrderSummary";
import OrderItem from "@/app/(dashboard)/orders/components/OrderItem";
import type {IOrder} from "@/app/actions/getOrders";
import {FaFacebook, FaGoogle, FaInstagram} from "react-icons/fa";
import {MdEdit} from "react-icons/md";
import ToolTip from "@/app/components/ToolTip";
import type {TrafficSource} from "@prisma/client";
import {FiFileText} from "react-icons/fi";


type Props = {
    order: IOrder;
    onEdit: (order: IOrder) => void;
};

const trafficSourceIcons = {
    FACEBOOK: {
        icon: FaFacebook,
        label: "Facebook",
        className: "text-blue-600 size-4.5",
    },
    INSTAGRAM: {
        icon: FaInstagram,
        label: "Instagram",
        className: "text-pink-600 size-5",
    },
    GOOGLE_SEARCH: {
        icon: FaGoogle,
        label: "Google Search",
        className: "text-blue-500",
    },
    GOOGLE_FREE_LISTING: {
        icon: FaGoogle,
        label: "Google Free Listing",
        className: "text-green-600",
    },
} as const satisfies Record<TrafficSource, {
    icon: typeof FaFacebook;
    label: string;
    className: string;
}>;

const TrafficSourceIcon = ({trafficSource}: {trafficSource: TrafficSource | null}) => {
    if (!trafficSource) {
        return null;
    }

    const {icon: Icon, label, className} = trafficSourceIcons[trafficSource];

    return <Icon className={`size-4 shrink-0 ${className}`} aria-label={label}/>;
};

const OrderCard = ({order, onEdit}: Props) => {
    return (
        <article className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="grid gap-4 border-b border-gray-200 px-4 py-4 sm:grid-cols-2 md:px-5">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">Замовлення {order.id}</p>
                        {
                            order.trafficSource &&
                            <ToolTip label={order.trafficSource}>
                                <TrafficSourceIcon trafficSource={order.trafficSource}/>
                            </ToolTip>
                        }

                        <ToolTip label="Редагувати">
                            <button
                                type="button"
                                onClick={() => onEdit(order)}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                                aria-label="Редагувати замовлення"
                            >
                                <MdEdit className="size-5"/>
                            </button>
                        </ToolTip>
                    </div>
                    {order.city && order.area && <p className="mt-2 text-base text-gray-700">{order.city}, {order.area} обл.</p>}
                    {order.warehouse && <p className="mt-1 break-words text-base text-gray-600">{order.warehouse}</p>}
                </div>
                <div className="min-w-0 sm:text-right">
                    <p className="font-medium text-gray-900">{order.firstName} {order.lastName}</p>
                    {order.phone && <a href={`tel:${order.phone}`} className="mt-2 block text-base text-gray-700 transition hover:text-gray-950">{order.phone}</a>}
                    {order.email && <a href={`mailto:${order.email}`} className="mt-1 block truncate text-base text-gray-600 transition hover:text-gray-950">{order.email}</a>}
                </div>
            </div>
            <div className="grid gap-5 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex min-w-0 flex-col">
                    <div className="hidden grid-cols-[minmax(0,1fr)_110px_90px_120px] gap-3 border-b border-gray-200 pb-3 text-sm font-medium text-gray-600 md:grid">
                        <span>Товар</span>
                        <span className="text-center">Ціна</span>
                        <span className="text-center">Кількість</span>
                        <span className="text-right">Усього</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {order.items.map(orderItem => <OrderItem key={orderItem.id} orderItem={orderItem}/>) }
                    </div>
                    {order.comment && (
                        <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3">
                            <span className="text-sm font-medium text-gray-600">Коментар</span>
                            <p className="mt-1 wrap-break-word text-base leading-6 text-gray-800">{order.comment}</p>
                        </div>
                    )}
                    {order.promoCodeSnapshot && order.discountAmount !== null && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-purple-50 px-4 py-3 text-base">
                            <div><span className="text-purple-500">Промокод</span><span className="ml-2 font-semibold tracking-wide text-purple-800">{order.promoCodeSnapshot}</span></div>
                            <span className="font-medium text-purple-700">−{order.discountAmount} грн</span>
                        </div>
                    )}
                    {(order.checkboxReceiptUrl || order.checkboxAfterpaymentReceiptUrl) && (
                        <div className="mt-auto pt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" aria-label="Фіскальні чеки">
                            {/*<span className="text-gray-500">Чеки:</span>*/}
                            {order.checkboxReceiptUrl && (
                                <a
                                    href={order.checkboxReceiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-gray-600 underline decoration-gray-300 underline-offset-4 transition hover:text-gray-950 hover:decoration-gray-500"
                                >
                                    <FiFileText className="size-3.5 text-gray-400" aria-hidden="true"/>
                                    {order.paymentMethod === "CASH_ON_DELIVERY" ? "Чек передоплати" : "Фіскальний чек"}
                                </a>
                            )}
                            {order.checkboxAfterpaymentReceiptUrl && (
                                <a
                                    href={order.checkboxAfterpaymentReceiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-gray-600 underline decoration-gray-300 underline-offset-4 transition hover:text-gray-950 hover:decoration-gray-500"
                                >
                                    <FiFileText className="size-3.5 text-gray-400" aria-hidden="true"/>
                                    Чек післяплати
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <OrderSummary order={order}/>
            </div>
        </article>
    )
};

export default OrderCard;
