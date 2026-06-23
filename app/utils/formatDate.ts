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

    const timePart = new Intl.DateTimeFormat("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Kyiv",
    }).format(date);

    return `${timePart}, ${datePart}`;
}