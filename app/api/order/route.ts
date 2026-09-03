import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import {createTTN} from "@/app/lib/novaposhta";
import {FormValuesOrder} from "@/app/types";

type ManualOrderRequest = FormValuesOrder & {
    warehouseNumber: number;
};

export async function POST(request: Request) {
    try {
        const body = await request.json() as ManualOrderRequest;
        const { firstName, lastName, phone, email, comment, city, area, cityRef, warehouse, warehouseNumber, warehouseRef, paymentMethod, items } = body;
        const normalizedPhone = phone.replace(/\D/g, "") || null;

        const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

        const order = await prisma.order.create({
            data: {
                status: "PAID", // ручной заказ сразу считается оплаченным
                totalAmount,
                firstName,
                lastName,
                phone: normalizedPhone,
                email,
                comment,
                city,
                area: area,
                cityRef: cityRef,
                warehouse: warehouse,
                warehouseNumber: warehouseNumber,
                warehouseRef: warehouseRef,
                paymentMethod: paymentMethod as PaymentMethod,
                paidAt: new Date(),
                items: {
                    create: items.map((item) => ({
                        productId: item.isCustom ? null : item.productId,
                        name: item.name.trim(),
                        price: item.price,
                        quantity: item.quantity,
                        color: item.color.trim() || null,
                        colorCode: item.colorCode.trim() || null,
                        colorName: item.colorName.trim() || null,
                        size: item.size.trim() || null,
                        imageUrl: item.imageUrl.trim() || null,
                        isCustom: item.isCustom,
                    })),
                },
            },
            include: {
                items: true,
            },
        });

        if (order.phone && order.firstName && order.lastName && order.warehouseRef && order.cityRef && order.warehouseNumber) try {
            const { ttnNumber, ttnRef } = await createTTN({
                recipientFirstName:order.firstName,
                recipientLastName: order.lastName,
                recipientPhone: order.phone,
                recipientCityRef: order.cityRef,
                recipientWarehouseRef: order.warehouseRef,
                recipientWarehouseNumber: order.warehouseNumber.toString(),
                serviceType: order.warehouse?.includes("Відділення") ? "WarehouseWarehouse" : "WarehousePostomat",
                cost: order.totalAmount,
                description: order.items.map(i => i.name).join(", "),
            });

            await prisma.order.update({
                where: { id: order.id },
                data: { ttnNumber, ttnRef },
            });
        } catch (ttnError) {
            // Не валим весь webhook, если ТТН не создалась — заказ всё равно оплачен
            console.error("Failed to create TTN for order", order.id, ttnError);
        }

        return NextResponse.json(null, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(error, { status: 500 });
    }
}
