import {IOrderItem} from "@/app/actions/getOrders";
import Image from "next/image";

type Props = {
    orderItem: IOrderItem;
};

const OrderItem = ({orderItem}: Props) => {
    return (
        <div className="flex flex-col sm:flex-row w-full text-gray-700 text-base lg:text-lg justify-between items-center gap-5">
            <div
                className="flex w-full sm:w-1/2 gap-1 items-center"
            >
                <Image
                    src={orderItem.imageUrl}
                    width={50}
                    height={50}
                    alt={orderItem.name}
                    className="object-cover aspect-square rounded-md border border-gray-400 shrink-0"
                />
                <span className="text-base">{orderItem.name}</span>
            </div>
            <span className="hidden md:inline-block md:w-[15%]">{orderItem.price} грн</span>
            <div
                className="flex justify-between items-center w-full sm:w-[45%] md:w-[30%] min-h-max min-w-max">
                <div className="flex items-center text-base gap-1 min-h-max min-w-max">
                    <span className="inline-block sm:hidden">Quantity: </span>
                    <span className="sm:ml-9">{orderItem.quantity}</span>
                </div>
                <span
                    className="text-base sm:text-lg text-gray-900 font-medium inline-block text-right "
                >
                    {(orderItem.price * orderItem.quantity).toFixed(2)+ " грн"}
                </span>
            </div>
        </div>
    );
};

export default OrderItem;