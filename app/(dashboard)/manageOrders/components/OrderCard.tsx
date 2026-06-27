import OrderSummary from "@/app/(dashboard)/manageOrders/components/OrderSummary";
import OrderItem from "@/app/(dashboard)/manageOrders/components/OrderItem";
import {IOrder} from "@/app/actions/getOrders";


type Props = {
    order: IOrder;
};

const OrderCard = ({order}: Props) => {
    return (
        <div className="text-base lg:text-lg py-5 md:py-10 px-5 text-gray-700 rounded-xl border-2 border-gray-500 bg-white">
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
                            className="flex flex-col gap-1 rounded-lg border border-gray-400 p-3 justify-self-end">
                            <span className="text-sm">Коментар:</span>
                            <p className="wrap-break-word">
                                {order.comment}
                            </p>
                        </div>
                    )}
                </div>
                <OrderSummary order={order}/>
            </div>
        </div>
    )
};

export default OrderCard;