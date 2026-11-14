import type { DocumentData } from "./types.ts";

/** Lower case and without accents, so that "Cantù" is found by typing "cantu". */
export const normalizeForSearch = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();

/** The text a document is searched by: people (all the landlords and tenants), address and number. */
export function buildSearchText(data: DocumentData, documentNumber: number) {
    const { details } = data;
    return normalizeForSearch(
        [
            details.landlord.name,
            ...details.additionalLandlords.map((party) => party.name),
            details.tenant.name,
            ...details.additionalTenants.map((party) => party.name),
            details.address,
            String(documentNumber),
        ]
            .filter(Boolean)
            .join(" "),
    );
}

/** Splits what the user typed in the search box in words that must all be present. */
export const searchTerms = (query: string) => normalizeForSearch(query).split(/\s+/).filter(Boolean);
