
export function getOrderDateKey(dateValue: Date | string) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Kyiv",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date(dateValue));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

export function formatDateAndTime(dateValue: Date | string) {
    const date = new Date(dateValue);

    const datePart = new Intl.DateTimeFormat("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Kyiv",
    })
        .format(date)
        .replace(" р.", "");

    const timePart = new Intl.DateTimeFormat("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Kyiv",
    }).format(date);

    return `${timePart}, ${datePart}`;
}

export function formatDate(dateValue: Date | string) {
    const date = new Date(dateValue);

    const datePart = new Intl.DateTimeFormat("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Kyiv",
    })
        .format(date)
        .replace(" р.", "");


    return datePart;
}

