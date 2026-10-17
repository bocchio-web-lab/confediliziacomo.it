import { NET_SURFACE_ID, isValidIsoDate } from "./calculate.ts";
import type { AccordDefinition, CalculationInput, SurchargeValue } from "./types.ts";

const MAX_PARAMETER_NUMBER = 13;

export function defaultSurchargeValue(definition: AccordDefinition["surcharges"][number]): SurchargeValue {
    switch (definition.kind) {
        case "toggle":
            return false;
        case "select":
            return definition.options[0].value;
        case "range":
            return 0;
    }
}

/** An empty form for the given accord. */
export function emptyCalculationInput(accord: AccordDefinition, contractDate = ""): CalculationInput {
    return {
        contractDate,
        zone: null,
        floor: 0,
        surfaces: {
            [NET_SURFACE_ID]: 0,
            ...Object.fromEntries(accord.surfaceItems.map((item) => [item.id, 0])),
        },
        parameters: [],
        noIndoorBathroom: false,
        surcharges: Object.fromEntries(
            accord.surcharges.map((definition) => [definition.id, defaultSurchargeValue(definition)]),
        ),
        partialLease: null,
    };
}

const toNumber = (value: unknown) => {
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
};

/**
 * Turns untrusted data (the JSON sent by the browser) into a well-formed input for
 * `accord`: unknown fields are dropped and missing ones get their default.
 */
export function sanitizeCalculationInput(raw: unknown, accord: AccordDefinition): CalculationInput {
    const data = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
    const defaults = emptyCalculationInput(accord);
    const rawSurfaces = (typeof data.surfaces === "object" && data.surfaces ? data.surfaces : {}) as Record<string, unknown>;
    const rawSurcharges = (typeof data.surcharges === "object" && data.surcharges ? data.surcharges : {}) as Record<string, unknown>;
    const rawPartial = data.partialLease as Record<string, unknown> | null | undefined;

    return {
        contractDate:
            typeof data.contractDate === "string" && isValidIsoDate(data.contractDate) ? data.contractDate : "",
        zone: accord.zones.some((zone) => zone.value === data.zone) ? (data.zone as number) : null,
        floor: Number.isInteger(data.floor) && (data.floor as number) >= 0 ? (data.floor as number) : 0,
        surfaces: Object.fromEntries(
            Object.keys(defaults.surfaces).map((id) => [id, toNumber(rawSurfaces[id])]),
        ),
        parameters: Array.isArray(data.parameters)
            ? [...new Set(data.parameters.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= MAX_PARAMETER_NUMBER))]
            : [],
        noIndoorBathroom: data.noIndoorBathroom === true,
        surcharges: Object.fromEntries(
            accord.surcharges.map((definition) => {
                const value = rawSurcharges[definition.id];
                const sanitized: SurchargeValue =
                    definition.kind === "toggle"
                        ? value === true
                        : definition.kind === "select"
                          ? definition.options.some((option) => option.value === value)
                              ? (value as string)
                              : definition.options[0].value
                          : Math.min(toNumber(value), definition.maxPercent);
                return [definition.id, sanitized];
            }),
        ),
        partialLease: rawPartial
            ? {
                  tenantSurface: toNumber(rawPartial.tenantSurface),
                  otherTenantsSurface: toNumber(rawPartial.otherTenantsSurface),
              }
            : null,
    };
}
