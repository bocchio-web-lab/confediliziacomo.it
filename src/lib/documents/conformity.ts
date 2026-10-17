import type { CalculationResult } from "#lib/accords/types.ts";
import type { DocumentDetails } from "./types.ts";

export type Conformity =
    | { status: "not-provided" }
    | { status: "conforming" | "below-minimum" | "above-maximum"; annualRent: number; min: number; max: number };

// Rents are compared to the cent, as they appear on the printed document.
const roundToCents = (value: number) => Math.round(value * 100) / 100;

/** Compares the annual rent agreed by the parties with the range allowed by the accord. */
export function checkConformity(result: CalculationResult, details: DocumentDetails): Conformity {
    const range = result.partialLease?.annual ?? result.annual;
    const annualRent = result.partialLease ? details.partialAgreedAnnualRent : details.agreedAnnualRent;
    if (!range || annualRent <= 0) return { status: "not-provided" };

    const min = roundToCents(range.min);
    const max = roundToCents(range.max);
    const rent = roundToCents(annualRent);
    const status = rent < min ? "below-minimum" : rent > max ? "above-maximum" : "conforming";
    return { status, annualRent: rent, min, max };
}
