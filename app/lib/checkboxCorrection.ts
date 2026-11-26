import "server-only";

import {createHash} from "node:crypto";
import {setTimeout as delay} from "node:timers/promises";
import type {Order, PaymentSource} from "@prisma/client";
import {getReceiptLines, type OrderDocumentData} from "@/app/lib/orderDocuments";
import {version} from "@/package.json";

type Payment = {
    type: "CASHLESS" | "CASH";
    code?: number | null;
    value: number;
    label?: string | null;
};

type Discount = {type: string; mode: string; value: number; tax_code?: number; name?: string};

type Receipt = {
    id: string;
    status: string;
    fiscal_code?: string | null;
    fiscal_date?: string | null;
    transaction?: {response_error_message?: string | null};
    pre_payment_relation_id?: string | null;
    footer?: string | null;
    goods?: {
        good: {code: string; name: string; price: number; barcode?: string; uktzed?: string};
        quantity: number;
        is_return?: boolean;
        taxes?: {code: number}[];
        discounts?: Discount[];
    }[];
    discounts?: Discount[];
    payments?: Payment[];
};

type Relation = {
    receipt_chain: {
        pre_payment_receipts: string[];
        after_payment_receipt: string | null;
        returned_receipts: string[];
    };
};

type Shift = {
    id: string;
    status: string;
    cash_register?: {fiscal_number?: string | null};
    initial_transaction?: {response_id?: string | null};
    cashier?: {signature_type?: string | null};
};

type CheckboxResponse<T> = {data: T | null; status: number; code: string | null};

type ReceiptFields = Pick<Order, "checkboxReceiptId" | "checkboxReceiptStatus" | "checkboxReceiptFiscalCode" |
    "checkboxReceiptCreatedAt" | "checkboxReceiptUrl" | "checkboxPrepaymentRelationId" |
    "checkboxAfterpaymentReceiptId" | "checkboxAfterpaymentStatus" | "checkboxAfterpaymentFiscalCode" |
    "checkboxAfterpaymentCreatedAt" | "checkboxAfterpaymentReceiptUrl">;

type CorrectionOrder = OrderDocumentData & Pick<Order, "id" | "email" | "status">;

const paymentLabels: Record<PaymentSource | "NOVAPAY", string> = {
    MONOBANK: "Платіж через інтегратора mono",
    CURRENT_ACCOUNT: "З поточного рахунку",
    NOVAPAY: "Платіж через інтегратора NovaPay",
};

function cashlessPayment(value: number, source: PaymentSource | "NOVAPAY"): Payment {
    return {type: "CASHLESS", code: 1, value, label: paymentLabels[source]};
}

function correctionId(receiptId: string, operation: string, attempt: number) {
    const hex = createHash("sha256").update(`blackberry-admin:${receiptId}:${operation}:${attempt}`).digest("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function assertProduction(...markers: (string | null | undefined)[]) {
    if (process.env.NODE_ENV === "production" && markers.some((value) => /^TEST/i.test(value ?? ""))) {
        throw new Error("Checkbox повернув тестові дані. Перевірте касу та ПІН касира");
    }
}

export async function prepareOrderReceiptCorrection(
    originalOrder: Pick<Order, "checkboxReceiptId" | "checkboxPrepaymentRelationId" | "checkboxAfterpaymentReceiptId">,
    order: CorrectionOrder,
): Promise<() => Promise<ReceiptFields>> {
    const {checkboxReceiptId: originalId} = originalOrder;
    if (!originalId) throw new Error("У замовленні відсутній ідентифікатор фіскального чека");

    const licenseKey = process.env.CHECKBOX_LICENSE_KEY ?? "";
    const pinCode = process.env.CHECKBOX_CASHIER_PIN_CODE;
    if (!licenseKey || !pinCode) throw new Error("Для коригування чека налаштуйте CHECKBOX_LICENSE_KEY і CHECKBOX_CASHIER_PIN_CODE");

    const signal = AbortSignal.timeout(53_000);
    async function request<T>(path: string, body?: unknown, authenticate = true): Promise<CheckboxResponse<T>> {
        const response = await fetch(`https://api.checkbox.ua/api/v1${path}`, {
            method: body === undefined ? "GET" : "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-Client-Name": "BlackBerry Shop",
                "X-Client-Version": version,
                "X-License-Key": licenseKey,
                ...(authenticate ? {Authorization: `Bearer ${token}`} : {}),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            cache: "no-store",
            signal,
        });
        const result: unknown = await response.json().catch(() => null);
        if (!response.ok) {
            const code = result && typeof result === "object" && "code" in result && typeof result.code === "string" ? result.code : null;
            return {data: null, status: response.status, code};
        }
        return {data: result as T, status: response.status, code: null};
    }

    function requireData<T>(response: CheckboxResponse<T>, message: string): T {
        if (response.data === null) throw new Error(`${message} (Checkbox: ${response.code ?? response.status})`);
        return response.data;
    }

    const signedIn = requireData(await request<{access_token?: string}>("/cashier/signinPinCode", {pin_code: pinCode}, false), "Не вдалося увійти в Checkbox");
    const token = signedIn.access_token;
    if (!token) throw new Error("Checkbox не повернув токен касира");

    async function getReceipt(id: string) {
        const response = await request<Receipt>(`/receipts/${encodeURIComponent(id)}`);
        if (response.status === 404) return null;
        const receipt = requireData(response, "Не вдалося отримати чек");
        if (receipt.id !== id) throw new Error("Checkbox повернув інший чек");
        return receipt;
    }

    async function waitForReceipt(receipt: Receipt) {
        let current = receipt;
        while (current.status !== "DONE") {
            if (current.status === "ERROR" || current.status === "CANCELLED") {
                throw new Error(current.transaction?.response_error_message ??
                    `Checkbox не фіскалізував чек ${current.id} (${current.status})`);
            }
            await delay(750, undefined, {signal});
            const updated = await getReceipt(current.id);
            if (!updated) throw new Error(`Checkbox не повернув чек ${current.id}`);
            current = updated;
        }
        assertProduction(current.fiscal_code);
        return current;
    }

    async function getOperation(operation: string) {
        for (let attempt = 0; attempt < 3; attempt += 1) {
            const id = correctionId(original.id, operation, attempt);
            const receipt = await getReceipt(id);
            if (!receipt || receipt.fiscal_code || (receipt.status !== "ERROR" && receipt.status !== "CANCELLED")) {
                return {id, receipt};
            }
        }
        throw new Error("Checkbox тричі відхилив фіскалізацію. Перевірте чеки в касі");
    }

    async function issueReceipt(
        operation: Awaited<ReturnType<typeof getOperation>>,
        path: string,
        payload: object,
    ) {
        const receipt = operation.receipt ?? requireData(
            await request<Receipt>(path, {...payload, id: operation.id}),
            "Не вдалося надіслати чек",
        );
        if (receipt.id !== operation.id) throw new Error("Checkbox повернув інший чек");
        return waitForReceipt(receipt);
    }

    const storedOriginal = await getReceipt(originalId);
    if (!storedOriginal) throw new Error("Початковий чек не знайдено в Checkbox");
    const original = await waitForReceipt(storedOriginal);
    const originalRelation = original.pre_payment_relation_id ?? originalOrder.checkboxPrepaymentRelationId;
    const relationPath = originalRelation ? `/prepayment-receipts/${encodeURIComponent(originalRelation)}` : null;
    const chain = relationPath
        ? requireData(await request<Relation>(relationPath), "Не вдалося отримати ланцюжок чеків").receipt_chain
        : null;
    if (chain && (chain.pre_payment_receipts.length !== 1 || chain.pre_payment_receipts[0] !== originalId ||
        (originalOrder.checkboxAfterpaymentReceiptId && chain.after_payment_receipt !== originalOrder.checkboxAfterpaymentReceiptId))) {
        throw new Error("Ланцюжок чеків у Checkbox змінився. Перевірте його в касі");
    }
    if (!chain && (!original.goods?.length || original.goods.some(({is_return}) => is_return) || !original.payments?.length)) {
        throw new Error("У початковому чеку відсутні дані для технічного повернення");
    }

    const lines = getReceiptLines(order.items);
    const total = lines.reduce((sum, line) => sum + line.price * line.quantity / 1000, 0);
    const cod = order.paymentMethod === "CASH_ON_DELIVERY";
    const prepayment = cod && order.status === "DELIVERED"
        ? original.payments?.reduce((sum, payment) => sum + payment.value, 0) ?? 0
        : Math.round(order.totalAmount * 100);
    if (!lines.length || lines.some((line) => !line.name || line.price <= 0 || !Number.isSafeInteger(line.quantity)) ||
        !Number.isSafeInteger(total) || (cod && (!Number.isSafeInteger(prepayment) || prepayment <= 0 ||
            prepayment >= total || !order.ttnNumber || (order.status === "DELIVERED" && !chain)))) {
        throw new Error("Перевірте позиції, суми оплати та номер ТТН перед коригуванням чека");
    }

    const issueAfterpayment = cod && (order.status === "DELIVERED" || Boolean(chain?.after_payment_receipt));
    const fingerprint = createHash("sha256")
        .update(JSON.stringify([lines, order.paymentSource, cod, cod ? prepayment : total, cod ? order.ttnNumber : null, issueAfterpayment]))
        .digest("hex").slice(0, 16);
    const footer = `Замовлення №${order.id}, коригування ${fingerprint}`;
    const replacement = await getOperation("replacement");
    if (replacement.receipt && replacement.receipt.footer !== footer) {
        throw new Error("Коригування вже розпочато з іншими даними. Повторіть попередні зміни або перевірте чек у Checkbox");
    }

    const activeShift = await request<Shift>("/cashier/shift");
    let shift = activeShift.data;
    if (!shift && activeShift.status !== 400 && activeShift.status !== 404) {
        requireData(activeShift, "Не вдалося отримати зміну Checkbox");
    }
    if (!shift || shift.status === "CLOSED") {
        const opened = await request<Shift>("/shifts", {});
        shift = opened.status === 400
            ? requireData(await request<Shift>("/cashier/shift"), "Не вдалося отримати відкриту зміну Checkbox")
            : requireData(opened, "Не вдалося відкрити зміну Checkbox");
    }
    while (shift.status === "CREATED" || shift.status === "OPENING") {
        await delay(750, undefined, {signal});
        shift = requireData(await request<Shift>(`/shifts/${encodeURIComponent(shift.id)}`), "Не вдалося отримати зміну Checkbox");
    }
    if (shift.status !== "OPENED") throw new Error("Для коригування потрібна відкрита зміна Checkbox");
    assertProduction(shift.cash_register?.fiscal_number, shift.initial_transaction?.response_id, shift.cashier?.signature_type);

    return async function completeCorrection() {
        if (relationPath && chain) {
            const expectedReturns = chain.after_payment_receipt ? 2 : 1;
            const returns = chain.returned_receipts.length
                ? await Promise.all(chain.returned_receipts.map(async (id) => {
                    const receipt = await getReceipt(id);
                    if (!receipt) throw new Error(`Не знайдено чек повернення ${id}`);
                    return receipt;
                }))
                : requireData(await request<Receipt[]>(`${relationPath}/return`, {}), "Не вдалося повернути чеки передоплати");
            if (returns.length !== expectedReturns) throw new Error("Неповний ланцюжок чеків повернення Checkbox");
            await Promise.all(returns.map(waitForReceipt));
        } else {
            const reversal = await getOperation("return");
            await issueReceipt(reversal, "/receipts/sell", {
                goods: original.goods?.map(({good, quantity, taxes, discounts}) => ({
                    good: {...good, ...(taxes?.length ? {tax: taxes.map(({code}) => code)} : {})},
                    quantity,
                    is_return: true,
                    ...(discounts?.length ? {discounts} : {}),
                })),
                payments: original.payments?.map(({type, code, value, label}) => ({type, code, value, label})),
                ...(original.discounts?.length ? {discounts: original.discounts} : {}),
                related_receipt_id: original.id,
                technical_return: true,
            });
        }

        const email = order.email?.trim();
        const phone = order.phone?.replace(/\D/g, "");
        const receiptPhone = /^0\d{9}$/.test(phone ?? "") ? `+38${phone}`
            : /^380\d{9}$/.test(phone ?? "") ? `+${phone}` : null;
        const delivery = {...(email ? {emails: [email]} : {}), ...(receiptPhone ? {phone: receiptPhone} : {})};
        const initial = await issueReceipt(replacement, cod ? "/prepayment-receipts" : "/receipts/sell", {
            goods: lines.map(({name, price, quantity}, index) => ({
                good: {code: `order-${order.id}-item-${index + 1}`, name, price},
                quantity,
            })),
            payments: [cashlessPayment(cod ? prepayment : total, order.paymentSource)],
            footer,
            ...(cod ? {ettn: order.ttnNumber} : {}),
            ...(Object.keys(delivery).length ? {delivery} : {}),
        });
        const newRelation = initial.pre_payment_relation_id ?? null;
        if (cod && !newRelation) throw new Error("Checkbox не повернув ідентифікатор передоплати");
        const afterpayment = issueAfterpayment && newRelation
            ? await issueReceipt(await getOperation("afterpayment"), `/prepayment-receipts/${encodeURIComponent(newRelation)}`, {
                payments: [cashlessPayment(total - prepayment, "NOVAPAY")],
                ...(Object.keys(delivery).length ? {delivery} : {}),
            })
            : null;

        return {
            checkboxReceiptId: initial.id,
            checkboxReceiptStatus: initial.status,
            checkboxReceiptFiscalCode: initial.fiscal_code ?? null,
            checkboxReceiptCreatedAt: initial.fiscal_date ? new Date(initial.fiscal_date) : new Date(),
            checkboxReceiptUrl: `https://check.checkbox.ua/${initial.id}`,
            checkboxPrepaymentRelationId: newRelation,
            checkboxAfterpaymentReceiptId: afterpayment?.id ?? null,
            checkboxAfterpaymentStatus: afterpayment?.status ?? null,
            checkboxAfterpaymentFiscalCode: afterpayment?.fiscal_code ?? null,
            checkboxAfterpaymentCreatedAt: afterpayment ? (afterpayment.fiscal_date ? new Date(afterpayment.fiscal_date) : new Date()) : null,
            checkboxAfterpaymentReceiptUrl: afterpayment ? `https://check.checkbox.ua/${afterpayment.id}` : null,
        };
    };
}
