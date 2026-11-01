import { isValidIsoDate } from "#lib/accords/calculate.ts";
import { sanitizeCalculationInput } from "#lib/accords/input.ts";
import type { AccordDefinition, CalculationInput, CalculationResult, Territory } from "#lib/accords/types.ts";

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

/** How the date of a document is called in the messages of `calculate`. */
export const dateNameOf = (kind: DocumentKind) =>
    kind === "prospectus" ? "data del prospetto" : "data di stipula del contratto";

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
    /** Street and number of the apartment. */
    address: string;
    /** Interior number. */
    unit: string;
    /** Date printed next to the place ("Como, lì"). For a prospectus it is the date of the calculation. */
    issueDate: string;
    /** The person who asks for the document. In a prospectus only the name is used. */
    landlord: Party;
    /** Prospectuses only: print the signature and stamp of the association. */
    showSignature: boolean;
    // The fields below are only used by attestations.
    tenant: Party;
    /** Start date of the lease. */
    leaseStartDate: string;
    registration: Registration;
    agreedAnnualRent: number;
    /** Annual rent agreed for the portion of the apartment (partial leases). */
    partialAgreedAnnualRent: number;
    /** Free lines about the fascia, e.g. why it was lowered because of the state of the apartment. */
    fasciaNotes: string;
}

export interface DocumentData {
    calculation: CalculationInput;
    details: DocumentDetails;
    /**
     * Number requested for a new document (to keep the numbers of documents made before).
     * Ignored when editing, and when empty the next number of the sequence is assigned.
     */
    requestedNumber: number | null;
}

export interface StoredDocument {
    id: string;
    kind: DocumentKind;
    territory: Territory;
    accordId: string;
    documentNumber: number;
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
    kind: DocumentKind;
    territory: Territory;
    documentNumber: number;
    applicantName: string;
    address: string;
    contractDate: string;
    createdAt: string;
    createdByName: string;
    updatedAt: string;
    updatedByName: string;
}

/**
 * What identifies a document in a list: the name of the person, or the address when there is
 * no name. The address, when it is not the main text, goes next to the name.
 */
export function documentLabel({ applicantName, address }: Pick<DocumentSummary, "applicantName" | "address">) {
    return applicantName
        ? { primary: applicantName, secondary: address }
        : { primary: address || "Senza nome né indirizzo", secondary: "" };
}

const emptyParty = (): Party => ({ name: "", taxCode: "", residence: "" });

export const emptyDocumentDetails = (): DocumentDetails => ({
    address: "",
    unit: "",
    issueDate: "",
    landlord: emptyParty(),
    showSignature: true,
    tenant: emptyParty(),
    leaseStartDate: "",
    registration: { isPending: false, date: "", number: "", office: "" },
    agreedAnnualRent: 0,
    partialAgreedAnnualRent: 0,
    fasciaNotes: "",
});

const MAX_NOTES_LENGTH = 800;

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
        address: text(data.address),
        unit: text(data.unit, 40),
        issueDate: isoDate(data.issueDate),
        landlord: party(data.landlord),
        showSignature: data.showSignature !== false,
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
        fasciaNotes: text(data.fasciaNotes, MAX_NOTES_LENGTH),
    };
}

export function sanitizeDocumentData(raw: unknown, accord: AccordDefinition): DocumentData {
    const data = (typeof raw === "object" && raw ? raw : {}) as Record<string, unknown>;
    const requested = Number(data.requestedNumber);
    return {
        calculation: sanitizeCalculationInput(data.calculation, accord),
        details: sanitizeDocumentDetails(data.details),
        requestedNumber: Number.isInteger(requested) && requested > 0 && requested <= 2_000_000_000 ? requested : null,
    };
}
