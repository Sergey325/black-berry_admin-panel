export function getOrderSearchId(value: string) {
    if (!/^\d+$/.test(value)) return undefined;
    const id = Number(value);
    return id > 0 && id <= 2147483647 ? id : undefined;
}
