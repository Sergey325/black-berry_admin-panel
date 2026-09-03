import OrderSummary from "@/app/(dashboard)/orders/components/OrderSummary";
import OrderItem from "@/app/(dashboard)/orders/components/OrderItem";
import {IOrder} from "@/app/actions/getOrders";
import {FaFacebook} from "react-icons/fa";


type Props = {
    order: IOrder;
};

const OrderCard = ({order}: Props) => {
    return (
        <article className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="grid gap-4 border-b border-gray-200 px-4 py-4 sm:grid-cols-2 md:px-5">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">Замовлення {order.invoiceId || order.id}</p>
                        {order.fbc && <FaFacebook className="size-4 shrink-0 text-blue-600"/>}
                    </div>
                    {order.city && order.area && <p className="mt-2 text-base text-gray-700">{order.city}, {order.area} обл.</p>}
                    {order.warehouse && <p className="mt-1 break-words text-base text-gray-600">{order.warehouse}</p>}
                </div>
                <div className="min-w-0 sm:text-right">
                    {order.firstName && order.lastName && <p className="font-medium text-gray-900">{order.firstName} {order.lastName}</p>}
                    {order.phone && <a href={`tel:${order.phone}`} className="mt-2 block text-base text-gray-700 transition hover:text-gray-950">{order.phone}</a>}
                    {order.email && <a href={`mailto:${order.email}`} className="mt-1 block truncate text-base text-gray-600 transition hover:text-gray-950">{order.email}</a>}
                </div>
            </div>
            <div className="grid gap-5 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0">
                    <div className="hidden grid-cols-[minmax(0,1fr)_110px_90px_120px] gap-3 border-b border-gray-200 pb-3 text-sm font-medium text-gray-600 md:grid">
                        <span>Товар</span>
                        <span className="text-right">Ціна</span>
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
                </div>
                <OrderSummary order={order}/>
            </div>
        </article>
    )
};

export default OrderCard;
