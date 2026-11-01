import type { DocumentData } from "./types.ts";

/** Lower case and without accents, so that "Cantù" is found by typing "cantu". */
export const normalizeForSearch = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();

/** The text a document is searched by: people, address and number. */
export function buildSearchText(data: DocumentData, documentNumber: number) {
    return normalizeForSearch(
        [data.details.landlord.name, data.details.tenant.name, data.details.address, String(documentNumber)]
            .filter(Boolean)
            .join(" "),
    );
}

/** Splits what the user typed in the search box in words that must all be present. */
export const searchTerms = (query: string) => normalizeForSearch(query).split(/\s+/).filter(Boolean);
