const moneyFormat = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", useGrouping: "always" });
const numberFormat = (fractionDigits: number) =>
    new Intl.NumberFormat("it-IT", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits, useGrouping: "always" });

export const formatMoney = (value: number) => moneyFormat.format(value);

export const formatNumber = (value: number, fractionDigits = 2) => numberFormat(fractionDigits).format(value);

export const formatPercent = (value: number) => `${value > 0 ? "+" : ""}${formatNumber(value, value % 1 === 0 ? 0 : 1)}%`;

/** "2026-10-05" -> "05/10/2026". Empty or invalid values give an empty string. */
export const formatDate = (isoDate: string | null | undefined) =>
    isoDate && /^\d{4}-\d{2}-\d{2}/.test(isoDate) ? isoDate.slice(0, 10).split("-").reverse().join("/") : "";

/** Formats a timestamp (ISO or Postgres text) in the Italian style, e.g. "05/10/2026 14:30". */
export function formatDateTime(timestamp: string) {
    // Postgres writes timezones as "+02"; JavaScript needs "+02:00".
    const date = new Date(timestamp.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"));
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const todayIso = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
