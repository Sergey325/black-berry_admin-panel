const translitMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e",
    є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
    ш: "sh", щ: "shch", ь: "", ъ: "", ю: "iu", я: "ia"
};

function slugifyUa(str: string): string {
    return str
        .toLowerCase()
        .split("")
        .map(char => translitMap[char] ?? char)
        .join("")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default slugifyUa;