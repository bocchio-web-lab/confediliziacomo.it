import { isValidIsoDate } from "#lib/accords/calculate.ts";
import { sanitizeCalculationInput } from "#lib/accords/input.ts";
import type { AccordDefinition, CalculationInput, CalculationResult } from "#lib/accords/types.ts";

export type DocumentKind = "prospectus" | "attestation";

/** Names used in the URLs of the private area. */
export const KIND_SLUGS: Record<string, DocumentKind> = {
    prospetti: "prospectus",
    attestazioni: "attestation",
};

export const KIND_LABELS: Record<DocumentKind, { singular: string; plural: string; slug: string }> = {
    prospectus: { singular: "Prospetto di calcolo", plural: "Prospetti di calcolo", slug: "prospetti" },
    attestation: { singular: "Attestazione di rispondenza", plural: "Attestazioni di rispondenza", slug: "attestazioni" },
};

export interface Party {
    name: string;
    taxCode: string;
    residence: string;
}

export interface Registration {
    /** True while the contract is still waiting to be registered. */
    isPending: boolean;
    date: string;
    number: string;
    office: string;
}

/** Free-text data that appears on the printed document. Every field is optional. */
export interface DocumentDetails {
    /** Progressive number of the document ("N."). */
    number: string;
    /** Street and number of the apartment. */
    address: string;
    /** Interior number. */
    unit: string;
    /** Date printed next to the place ("Como, lì"). */
    issueDate: string;
    // The fields below are only used by attestations.
    landlord: Party;
    tenant: Party;
    /** Start date of the lease. */
    leaseStartDate: string;
    registration: Registration;
    agreedAnnualRent: number;
    /** Annual rent agreed for the portion of the apartment (partial leases). */
    partialAgreedAnnualRent: number;
}

export interface DocumentData {
    calculation: CalculationInput;
    details: DocumentDetails;
}

export interface StoredDocument {
    id: string;
    kind: DocumentKind;
    territory: "city" | "province";
    accordId: string;
    number: string | null;
    contractDate: string;
    title: string;
    data: DocumentData;
    result: CalculationResult;
    createdAt: string;
    createdByName: string;
    updatedAt: string;
    updatedByName: string;
}

export interface DocumentSummary {
    id: string;
    number: string | null;
    title: string;
    territory: "city" | "province";
    contractDate: string;
    monthlyMin: number | null;
    monthlyMax: number | null;
    createdAt: string;
    createdByName: string;
    updatedAt: string;
    updatedByName: string;
}

const emptyParty = (): Party => ({ name: "", taxCode: "", residence: "" });

export const emptyDocumentDetails = (): DocumentDetails => ({
    number: "",
    address: "",
    unit: "",
    issueDate: "",
    landlord: emptyParty(),
    tenant: emptyParty(),
    leaseStartDate: "",
    registration: { isPending: false, date: "", number: "", office: "" },
    agreedAnnualRent: 0,
    partialAgreedAnnualRent: 0,
});

const text = (value: unknown, maxLength = 300) =>
    typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const isoDate = (value: unknown) => (typeof value === "string" && isValidIsoDate(value) ? value : "");

const money = (value: unknown) => {
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
};

const party = (value: unknown): Party => {
    const data = (typeof value === "object" && value ? value : {}) as Record<string, unknown>;
    return { name: text(data.name), taxCode: text(data.taxCode, 30), residence: text(data.residence) };
};

/** Cleans the details sent by the browser: wrong types become empty values. */
export function sanitizeDocumentDetails(raw: unknown): DocumentDetails {
    const data = (typeof raw === "object" && raw ? raw : {}) as Record<string, unknown>;
    const registration = (typeof data.registration === "object" && data.registration ? data.registration : {}) as Record<string, unknown>;

    return {
        number: text(data.number, 40),
        address: text(data.address),
        unit: text(data.unit, 40),
        issueDate: isoDate(data.issueDate),
        landlord: party(data.landlord),
        tenant: party(data.tenant),
        leaseStartDate: isoDate(data.leaseStartDate),
        registration: {
            isPending: registration.isPending === true,
            date: isoDate(registration.date),
            number: text(registration.number, 60),
            office: text(registration.office),
        },
        agreedAnnualRent: money(data.agreedAnnualRent),
        partialAgreedAnnualRent: money(data.partialAgreedAnnualRent),
    };
}

export function sanitizeDocumentData(raw: unknown, accord: AccordDefinition): DocumentData {
    const data = (typeof raw === "object" && raw ? raw : {}) as Record<string, unknown>;
    return {
        calculation: sanitizeCalculationInput(data.calculation, accord),
        details: sanitizeDocumentDetails(data.details),
    };
}
