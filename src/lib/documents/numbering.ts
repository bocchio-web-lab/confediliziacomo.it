import type { Territory } from "#lib/accords/types.ts";
import type { DocumentKind } from "./types.ts";

/**
 * Documents are numbered progressively inside a sequence: one sequence for every
 * combination of document kind and territory (prospetti and attestazioni, Comune and Provincia,
 * so four sequences). Numbers are never reused.
 *
 * To number differently (for example one sequence per kind, whatever the territory) change this
 * function and add a migration that rewrites `sequence_key` of the existing documents and
 * `document_counters`: the key is stored with every document.
 */
export const sequenceKey = (kind: DocumentKind, territory: Territory) => `${kind}:${territory}`;

export const SEQUENCE_LABELS: Record<Territory, string> = {
    city: "Comune di Como",
    province: "Provincia di Como",
};
