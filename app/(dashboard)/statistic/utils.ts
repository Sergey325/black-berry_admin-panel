export function formatCurrency(value: number) {
    const amount = new Intl.NumberFormat("uk-UA", {
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value).replace(/\s/g, " ");

    return `${amount} ₴`;
}

export function getOrdersChange(current: number, previous: number) {
    if (previous === 0) return null;
    return Math.round((((current - previous) / previous) * 100 + Number.EPSILON) * 100) / 100;
}
