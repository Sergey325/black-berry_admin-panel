const API_URL = "https://api.novaposhta.ua/v2.0/json/";
const API_KEY = process.env.NOVA_POSHTA_API_KEY!;
const MAX_DESCRIPTION_LENGTH = 100;

export interface NovaPoshtaDocument {
    Number: string;
}

export interface NovaPoshtaStatusDocument {
    Number: string;
    RefEW?: string;
    Status: string;
    StatusCode: string | number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isStatusDocument(value: unknown): value is NovaPoshtaStatusDocument {
    if (!isRecord(value)) return false;

    const hasStatusCode = typeof value.StatusCode === "string" || typeof value.StatusCode === "number";

    return typeof value.Number === "string" && typeof value.Status === "string" && hasStatusCode;
}

function formatApiErrors(errors: unknown) {
    if (!Array.isArray(errors)) return "Nova Poshta API request failed";

    const messages = errors.filter((error): error is string => typeof error === "string");
    return messages.length > 0 ? messages.join(", ") : "Nova Poshta API request failed";
}

export function chunk<T>(arr: T[], size: number): T[][] {
    if (!Number.isInteger(size) || size <= 0) {
        throw new RangeError("Chunk size must be a positive integer");
    }

    const chunks: T[][] = [];
    for (let index = 0; index < arr.length; index += size) {
        chunks.push(arr.slice(index, index + size));
    }

    return chunks;
}

export async function getStatusDocuments(
    documents: NovaPoshtaDocument[],
): Promise<NovaPoshtaStatusDocument[]> {
    const apiKey = process.env.NOVA_POSHTA_API_KEY;
    if (!apiKey) throw new Error("NOVA_POSHTA_API_KEY is not configured");

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            apiKey,
            modelName: "TrackingDocument",
            calledMethod: "getStatusDocuments",
            methodProperties: {
                Documents: documents.map(({Number}) => ({
                    DocumentNumber: Number.trim(),
                })),
            },
        }),
        signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
        throw new Error(`Nova Poshta API returned HTTP ${response.status}`);
    }

    const result: unknown = await response.json();
    if (!isRecord(result)) throw new Error("Nova Poshta API returned an invalid response");
    if (result.success === false) throw new Error(formatApiErrors(result.errors));
    if (result.success !== true || !Array.isArray(result.data) || !result.data.every(isStatusDocument)) {
        throw new Error("Nova Poshta API returned an invalid response");
    }

    return result.data;
}
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
        headers: {"Content-Type": "application/json"},
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
        signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) throw new Error(`Nova Poshta API returned HTTP ${res.status}`);
    const data: unknown = await res.json();

    if (!isRecord(data) || data.success !== true) {
        throw new Error(isRecord(data) ? formatApiErrors(data.errors) : "Не вдалося створити отримувача");
    }
    const recipient: unknown = Array.isArray(data.data) ? data.data[0] : undefined;
    const contact: unknown = isRecord(recipient) && isRecord(recipient.ContactPerson) &&
        Array.isArray(recipient.ContactPerson.data) ? recipient.ContactPerson.data[0] : undefined;
    if (!isRecord(recipient) || typeof recipient.Ref !== "string" || !isRecord(contact) || typeof contact.Ref !== "string") {
        throw new Error("Нова пошта не повернула дані отримувача");
    }

    return {
        recipientRef: recipient.Ref,
        contactRecipientRef: contact.Ref,
    };
}

type Shipment = {
    recipientFirstName: string;
    recipientLastName: string;
    recipientPhone: string;
    recipientCityRef: string;
    recipientWarehouseRef: string;
    cost: number;
    codAmount: number;
    serviceType: string;
    description: string;
};

export async function saveTTN({
    recipientFirstName,
    recipientLastName,
    recipientPhone,
    recipientCityRef,
    recipientWarehouseRef,
    cost,
    codAmount,
    serviceType,
    description,
}: Shipment, document?: {ttnNumber: string; ttnRef: string | null; hadCod: boolean}) {
    let ttnRef: string | undefined;
    if (document) {
        const ref = document.ttnRef || (await getStatusDocuments([{Number: document.ttnNumber}]))
            .find(({Number}) => Number === document.ttnNumber)?.RefEW;
        if (typeof ref !== "string" || !ref) throw new Error("Нова пошта не повернула ідентифікатор ТТН");
        ttnRef = ref;
    }

    if (!API_KEY) throw new Error("NOVA_POSHTA_API_KEY is not configured");
    if (!recipientFirstName || !recipientLastName || !recipientPhone || !recipientCityRef || !recipientWarehouseRef) {
        throw new Error("Заповніть дані отримувача, місто та відділення");
    }
    const senderWarehouseRef = process.env.NOVA_POSHTA_SENDER_WAREHOUSE_REF;
    if (!senderWarehouseRef) {
        throw new Error("NOVA_POSHTA_SENDER_WAREHOUSE_REF is not configured");
    }

    const { recipientRef, contactRecipientRef } = await getOrCreateRecipient({
        firstName: recipientFirstName,
        lastName: recipientLastName,
        phone: recipientPhone,
        cityRef: recipientCityRef,
    });

    const fullDescription = Array.from(`Одяг: ${description}`);
    const shipmentDescription = fullDescription.length <= MAX_DESCRIPTION_LENGTH
        ? fullDescription.join("")
        : `${fullDescription.slice(0, MAX_DESCRIPTION_LENGTH - 3).join("").trimEnd().replace(/,$/, "")}...`;

    const payload = {
        apiKey: API_KEY,
        modelName: "InternetDocument",
        calledMethod: ttnRef ? "update" : "save",
        methodProperties: {
            ...(ttnRef ? {Ref: ttnRef} : {}),
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
            Description: shipmentDescription,
            Cost: cost,
            AfterpaymentOnGoodsCost: codAmount > 0 || document?.hadCod ? String(codAmount) : undefined,
        },
    };
    const res = await fetch(API_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) throw new Error(`Nova Poshta API returned HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!isRecord(data) || data.success !== true) {
        throw new Error(isRecord(data) ? formatApiErrors(data.errors) : "Некоректна відповідь Нової пошти");
    }
    const saved: unknown = Array.isArray(data.data) ? data.data[0] : undefined;
    if (!isRecord(saved) || typeof saved.IntDocNumber !== "string" || typeof saved.Ref !== "string" ||
        !/^\d{14}$/.test(saved.IntDocNumber) || !saved.Ref) {
        throw new Error("Нова пошта не повернула номер або ідентифікатор ТТН");
    }

    return {
        ttnNumber: saved.IntDocNumber,
        ttnRef: saved.Ref,
    };
}
