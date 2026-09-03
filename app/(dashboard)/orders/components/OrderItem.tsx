import {IOrderItem} from "@/app/actions/getOrders";
import Image from "next/image";
import {FiImage} from "react-icons/fi";

type Props = {
    orderItem: IOrderItem;
};

const OrderItem = ({orderItem}: Props) => {
    return (
        <div className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_110px_90px_120px] md:items-center">
            <div className="flex min-w-0 items-center gap-3">
                {orderItem.imageUrl ? (
                    <Image
                        src={orderItem.imageUrl}
                        width={50}
                        height={50}
                        alt={orderItem.name}
                        className="aspect-square size-[50px] shrink-0 rounded-lg border border-gray-200 object-cover"
                    />
                ) : (
                    <span className="flex size-[50px] shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400">
                        <FiImage className="size-5"/>
                    </span>
                )}
                <p className="min-w-0 inline-flex gap-2 text-base font-medium text-gray-900 flex-wrap">
                    <span className="break-words">{orderItem.name}</span>
                    {orderItem.isCustom && <span className="rounded bg-amber-100 px-1.5 py-1 text-xs text-center font-medium text-amber-800 text-nowrap">Додано власноруч</span>}
                    {orderItem.colorName && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-gray-700 text-nowrap">{orderItem.colorName}</span>}
                    {orderItem.size && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-gray-700 text-nowrap">{orderItem.size}</span>}
                    {orderItem.colorCode && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-gray-700 text-nowrap">Код кольору: {orderItem.colorCode}</span>}
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
