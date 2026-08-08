import {IOrderItem} from "@/app/actions/getOrders";
import Image from "next/image";

type Props = {
    orderItem: IOrderItem;
};

const OrderItem = ({orderItem}: Props) => {
    return (
        <div className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_110px_90px_120px] md:items-center">
            <div className="flex min-w-0 items-center gap-3">
                <Image
                    src={orderItem.imageUrl}
                    width={50}
                    height={50}
                    alt={orderItem.name}
                    className="aspect-square size-[50px] shrink-0 rounded-lg border border-gray-200 object-cover"
                />
                <p className="min-w-0 text-base font-medium text-gray-900">
                    <span className="break-words">{orderItem.name}</span>
                    {orderItem.size && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-sm text-gray-700">{orderItem.size}</span>}
                </p>
            </div>
            <div className="flex items-center justify-between text-base md:contents">
                <div className="flex items-center gap-2 md:contents">
                    <span className="text-gray-700 md:text-right">
                        {orderItem.price} грн
                    </span>

                    <span className="text-gray-700 md:text-center">
                        <span className="md:hidden">× </span>
                        {orderItem.quantity}
                    </span>
                </div>

                <span className="font-semibold text-gray-900 md:text-right">
                    {(orderItem.price * orderItem.quantity).toFixed(2)} грн
                </span>
            </div>
        </div>
    );
};

export default OrderItem;
