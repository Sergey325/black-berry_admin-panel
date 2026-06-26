const API_URL = "https://api.novaposhta.ua/v2.0/json/";
const API_KEY = process.env.NOVA_POSHTA_API_KEY!;
//
async function getOrCreateRecipient({
    firstName,
    lastName,
    phone,
    cityRef,
}: {
    firstName: string;
    lastName: string;
    phone: string;
    cityRef: string;
}) {
    const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            apiKey: API_KEY,
            modelName: "Counterparty",
            calledMethod: "save",
            methodProperties: {
                FirstName: firstName,
                LastName: lastName,
                Phone: phone,
                CityRef: cityRef,
                CounterpartyType: "PrivatePerson",
                CounterpartyProperty: "Recipient",
            },
        }),
    });

    const data = await res.json();

    if (!data.success) {
        console.error("Counterparty creation error:", data.errors);
        throw new Error(data.errors?.[0] || "Не вдалося створити отримувача");
    }

    return {
        recipientRef: data.data[0].Ref,
        contactRecipientRef: data.data[0].ContactPerson.data[0].Ref,
    };
}

async function getWarehouseRef(cityRef: string, warehouseNumber: string) {
    console.log(`[getWarehouseRef] cityRef: ${cityRef}, warehouseNumber: "${warehouseNumber}"`);

    const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            apiKey: API_KEY,
            modelName: "AddressGeneral",
            calledMethod: "getWarehouses",
            methodProperties: {
                CityRef: cityRef,
                WarehouseId: warehouseNumber,
            },
        }),
    });

    const data = await res.json();
    console.log(`[getWarehouseRef] found ${data.data?.length ?? 0} warehouses`);
    if (data.data?.length > 0) {
        console.log(`[getWarehouseRef] result Ref: ${data.data[0].Ref}, Number: ${data.data[0].Number}, Description: ${data.data[0].Description}`);
    } else {
        console.log(`[getWarehouseRef] ❌ no warehouse found for warehouseNumber="${warehouseNumber}"`);
    }

    return data.data[0]?.Ref;
}

export async function createTTN({
                                    recipientFirstName,
                                    recipientLastName,
                                    recipientPhone,
                                    recipientCityRef,
                                    recipientWarehouseRef,
                                    recipientWarehouseNumber,
                                    cost,
                                    serviceType,
                                    description,
                                }: {
    recipientFirstName: string;
    recipientLastName: string;
    recipientPhone: string;
    recipientCityRef: string;
    recipientWarehouseRef: string;
    recipientWarehouseNumber: string;
    cost: number;
    serviceType: string;
    description: string;
}) {
    console.log("[createTTN] called with:", {
        recipientFirstName,
        recipientLastName,
        recipientPhone,
        recipientCityRef,
        recipientWarehouseNumber,
        cost,
        serviceType,
        description,
    });

    const senderWarehouseRef = await getWarehouseRef(
        process.env.NOVA_POSHTA_SENDER_CITY_REF!,
        "121"
    );
    console.log("[createTTN] senderWarehouseRef:", senderWarehouseRef);

    // const recipientWarehouseRef = await getWarehouseRef(
    //     recipientCityRef,
    //     recipientWarehouseNumber
    // );
    // console.log("[createTTN] recipientWarehouseRef:", recipientWarehouseRef);

    const { recipientRef, contactRecipientRef } = await getOrCreateRecipient({
        firstName: recipientFirstName,
        lastName: recipientLastName,
        phone: recipientPhone,
        cityRef: recipientCityRef,
    });
    console.log("[createTTN] recipientRef:", recipientRef, "contactRecipientRef:", contactRecipientRef);

    const payload = {
        apiKey: API_KEY,
        modelName: "InternetDocument",
        calledMethod: "save",
        methodProperties: {
            CitySender: process.env.NOVA_POSHTA_SENDER_CITY_REF,
            Sender: process.env.NOVA_POSHTA_SENDER_REF,
            SenderAddress: senderWarehouseRef,
            ContactSender: process.env.NOVA_POSHTA_CONTACT_SENDER_REF,
            SendersPhone: process.env.NOVA_POSHTA_SENDER_PHONE,

            CityRecipient: recipientCityRef,
            Recipient: recipientRef,
            RecipientAddress: recipientWarehouseRef,
            ContactRecipient: contactRecipientRef,
            RecipientsPhone: recipientPhone,

            PayerType: "Recipient",
            PaymentMethod: "Cash",
            CargoType: "Parcel",
            Weight: 2,
            ServiceType: serviceType,
            SeatsAmount: "1",
            OptionsSeat: [
                {
                    weight: 2,
                    volumetricWidth: 20,
                    volumetricLength: 20,
                    volumetricHeight: 10,
                    volumetricVolume: 0.002
                }
            ],
            Description: `Одяг: ${description}`,
            Cost: cost,
        },
    };
    console.log("[createTTN] InternetDocument payload methodProperties:", JSON.stringify(payload.methodProperties, null, 2));

    const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("[createTTN] InternetDocument response:", JSON.stringify(data, null, 2));

    if (!data.success) {
        console.error("NP TTN creation error:", data.errors);
        throw new Error(data.errors?.[0] || "Не вдалося створити ТТН");
    }

    return {
        ttnNumber: data.data[0].IntDocNumber,
        ttnRef: data.data[0].Ref,
    };
}