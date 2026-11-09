import type { Territory } from "#lib/accords/types.ts";
import type { DocumentKind } from "./types.ts";

/**
 * Documents are numbered progressively inside a sequence: one sequence for every combination of document kind
 * and territory (prospetti and attestazioni, Comune and Provincia), and the numbers start again from 1 every
 * year, as the association has always done. The year is the one in which the document is created (not the one
 * of the contract or of the date printed on it). Numbers are never reused inside a sequence.
 *
 * To number differently change `sequenceKey` and add a script or migration that rewrites `sequence_key` of the
 * existing documents and `document_counters`: the key is stored with every document (see scripts/db/renumber.ts).
 */
export const sequenceKey = (kind: DocumentKind, territory: Territory, year: number) => `${kind}:${territory}:${year}`;

/** The year a document created at `moment` is numbered in: the Italian one, as for the other dates of the site. */
export const numberingYear = (moment = new Date()) =>
    Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric" }).format(moment));

export const SEQUENCE_LABELS: Record<Territory, string> = {
    city: "Comune di Como",
    province: "Provincia di Como",
};
