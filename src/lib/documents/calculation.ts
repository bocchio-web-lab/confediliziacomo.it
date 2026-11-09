import { calculate, calculateWithoutRates } from "#lib/accords/calculate.ts";
import type { AccordDefinition, CalculationResult, IstatIndex } from "#lib/accords/types.ts";
import { LEASE_TYPES, dateNameOf, leaseTypeOf, type DocumentData, type DocumentKind } from "./types.ts";

/**
 * The result of a document: the calculation of the accord, except for the leases whose rent the accord leaves free
 * (nothing to calculate). The form, the server and the PDF of a saved document all go through here.
 */
export function calculateDocument(
    accord: AccordDefinition,
    data: DocumentData,
    kind: DocumentKind,
    indices: readonly IstatIndex[],
): CalculationResult {
    const dateName = dateNameOf(kind);
    const leaseType = leaseTypeOf(kind, accord.territory, data.details);
    return LEASE_TYPES[leaseType].hasBoundRent
        ? calculate(accord, data.calculation, indices, dateName)
        : calculateWithoutRates(accord, data.calculation, dateName);
}
