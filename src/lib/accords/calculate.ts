import type {
    AccordDefinition,
    AppliedSurcharge,
    CalculationInput,
    CalculationResult,
    Fascia,
    FloorBand,
    IstatIndex,
    MoneyRange,
    SizeBand,
    SurchargeContext,
    SurchargeDefinition,
    SurchargeValue,
} from "./types.ts";

/** Id of the surface that is always present: the net walkable area of the apartment. */
export const NET_SURFACE_ID = "net";

const CORE_PARAMETERS_LAST = 7;
const MONTHS_PER_YEAR = 12;

export const sizeBandOf = (netSurface: number): SizeBand =>
    netSurface > 100 ? "large" : netSurface >= 60 ? "medium" : "small";

/** From the lowest fascia to the highest. */
export const FASCIA_ORDER: readonly Fascia[] = ["minima", "media", "massima"];

export const floorBandOf = (floor: number): FloorBand => (floor <= 3 ? "low" : "high");

export const isValidIsoDate = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

const positive = (value: number | undefined) =>
    Number.isFinite(value) && (value as number) > 0 ? (value as number) : 0;

const scaleRange = (range: MoneyRange, factor: number): MoneyRange => ({
    min: range.min * factor,
    max: range.max * factor,
});

/** The index in force on `date`: the latest one that starts on or before it. */
export function findIstatIndex(indices: readonly IstatIndex[], date: string): IstatIndex | null {
    let found: IstatIndex | null = null;
    for (const index of indices) {
        if (index.validFrom <= date && (!found || index.validFrom > found.validFrom)) found = index;
    }
    return found;
}

export function surchargePercent(
    definition: SurchargeDefinition,
    value: SurchargeValue | undefined,
    context: SurchargeContext,
): number {
    switch (definition.kind) {
        case "toggle":
            return value === true && (definition.isAvailable?.(context) ?? true)
                ? definition.percent(context)
                : 0;
        case "select":
            return definition.options.find((option) => option.value === value)?.percent ?? 0;
        case "range": {
            if (!(definition.isAvailable?.(context) ?? true)) return 0;
            const requested = typeof value === "number" && Number.isFinite(value) ? value : 0;
            return Math.min(Math.max(requested, 0), definition.maxPercent);
        }
    }
}

/** The problems with the date the accord is chosen by. */
function dateIssues(accord: AccordDefinition, input: CalculationInput, dateName: string) {
    if (!isValidIsoDate(input.contractDate)) return [`Inserire la ${dateName}.`];
    if (input.contractDate < accord.validFrom) {
        return [
            `La ${dateName} è precedente all'accordo in vigore (${accord.territoryLabel}, dal ${accord.validFrom.split("-").reverse().join("/")}).`,
        ];
    }
    return [];
}

/**
 * The result for a lease with a free rent (a transitory one in the Provincia): nothing is calculated, only the date
 * is checked, since it decides which accord the contract is compared with.
 */
export function calculateWithoutRates(accord: AccordDefinition, input: CalculationInput, dateName: string): CalculationResult {
    return {
        accordId: accord.id,
        issues: dateIssues(accord, input, dateName),
        warnings: [],
        surface: null,
        classification: null,
        rateSource: null,
        baseRate: null,
        surcharges: [],
        totalSurchargePercent: 0,
        istat: null,
        ratePerSquareMeter: null,
        monthly: null,
        annual: null,
        partialLease: null,
    };
}

/**
 * @param dateName how the reference date is called in the messages shown to the user:
 *   the contract date for an attestation, the date of the document for a prospectus.
 */
export function calculate(
    accord: AccordDefinition,
    input: CalculationInput,
    istatIndices: readonly IstatIndex[],
    dateName = "data di stipula del contratto",
): CalculationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    const result: CalculationResult = {
        accordId: accord.id,
        issues,
        warnings,
        surface: null,
        classification: null,
        rateSource: null,
        baseRate: null,
        surcharges: [],
        totalSurchargePercent: 0,
        istat: null,
        ratePerSquareMeter: null,
        monthly: null,
        annual: null,
        partialLease: null,
    };

    // --- Required data -------------------------------------------------------------------
    issues.push(...dateIssues(accord, input, dateName));
    if (accord.zones.length > 0 && !accord.zones.some((zone) => zone.value === input.zone)) {
        issues.push("Selezionare la microzona.");
    }
    if (!Number.isInteger(input.floor) || input.floor < 0) {
        issues.push("Indicare il piano (piano terra = 0, primo piano = 1, ...).");
    }

    const netSurface = positive(input.surfaces[NET_SURFACE_ID]);
    if (netSurface === 0) issues.push("Inserire la superficie calpestabile dell'appartamento.");

    // --- Conventional surface ------------------------------------------------------------
    const lines = [
        {
            id: NET_SURFACE_ID,
            label: "Superficie calpestabile appartamento",
            area: netSurface,
            coefficient: 1,
            convertedArea: netSurface,
        },
        ...accord.surfaceItems.map((item) => {
            const area = positive(input.surfaces[item.id]);
            return {
                id: item.id,
                label: item.label,
                area,
                coefficient: item.coefficient,
                convertedArea: area * item.coefficient,
            };
        }),
    ];
    const bonus = accord.smallUnitBonus?.(netSurface, input.zone) ?? { percent: 0, area: 0 };
    const totalSurface = lines.reduce((sum, line) => sum + line.convertedArea, 0) + bonus.area;
    result.surface = {
        lines,
        smallUnitBonusPercent: bonus.percent,
        smallUnitBonusArea: bonus.area,
        total: totalSurface,
    };

    // --- Classification (fascia) ---------------------------------------------------------
    const sizeBand = sizeBandOf(netSurface);
    const floorBand = floorBandOf(input.floor);
    const parameters = new Set(input.parameters);
    const coreCount = [...parameters].filter((n) => n >= 1 && n <= CORE_PARAMETERS_LAST).length;
    const extraCount = [...parameters].filter((n) => n > CORE_PARAMETERS_LAST).length;
    const totalCount = coreCount + extraCount;
    const thresholds = accord.thresholds[sizeBand][floorBand];

    let automaticFascia: Fascia = "minima";
    if (!input.noIndoorBathroom) {
        if (coreCount >= thresholds.maximumCore && extraCount >= 1) automaticFascia = "massima";
        else if (totalCount >= thresholds.mediumTotal) automaticFascia = "media";
    }

    // An override can only lower the fascia, never raise it.
    const fascia =
        input.fasciaOverride && FASCIA_ORDER.indexOf(input.fasciaOverride) < FASCIA_ORDER.indexOf(automaticFascia)
            ? input.fasciaOverride
            : automaticFascia;
    result.classification = { sizeBand, floorBand, coreCount, extraCount, totalCount, fascia, automaticFascia };

    // --- Surcharges ----------------------------------------------------------------------
    const surchargeContext: SurchargeContext = { netSurface };
    const surcharges: AppliedSurcharge[] = [];
    for (const definition of accord.surcharges) {
        const percent = surchargePercent(definition, input.surcharges[definition.id], surchargeContext);
        if (percent !== 0) surcharges.push({ id: definition.id, label: definition.label, percent });
    }
    result.surcharges = surcharges;
    result.totalSurchargePercent = surcharges.reduce((sum, surcharge) => sum + surcharge.percent, 0);

    // --- Base rates and revaluation ------------------------------------------------------
    if (issues.length > 0) return result;

    const lookup = accord.rates({
        date: input.contractDate,
        zone: input.zone,
        conventionalSurface: totalSurface,
    });
    if (!lookup.found) {
        issues.push(lookup.reason);
        return result;
    }
    result.rateSource = lookup.label;
    result.baseRate = lookup.rates[fascia];

    let revaluation = 1;
    if (accord.usesIstat) {
        const index = findIstatIndex(istatIndices, input.contractDate);
        if (!index) {
            issues.push(`Nessun indice ISTAT disponibile per la ${dateName}.`);
            return result;
        }
        const isOutdated = index.validFrom.slice(0, 7) < input.contractDate.slice(0, 7);
        revaluation = index.coefficient;
        result.istat = { coefficient: index.coefficient, validFrom: index.validFrom, isOutdated };
        if (isOutdated) {
            warnings.push(
                "L'indice ISTAT del mese di stipula non è ancora stato inserito: è stato usato l'ultimo disponibile.",
            );
        }
    }

    const surchargeFactor = 1 + result.totalSurchargePercent / 100;
    const minPerSquareMeter = result.baseRate.min * surchargeFactor * revaluation;
    const maxPerSquareMeter = input.noIndoorBathroom
        ? minPerSquareMeter * accord.noIndoorBathroomMaxFactor
        : result.baseRate.max * surchargeFactor * revaluation;

    result.ratePerSquareMeter = { min: minPerSquareMeter, max: maxPerSquareMeter };
    result.monthly = scaleRange(result.ratePerSquareMeter, totalSurface);
    result.annual = scaleRange(result.monthly, MONTHS_PER_YEAR);

    // --- Partial lease -------------------------------------------------------------------
    if (input.partialLease) {
        const tenantSurface = positive(input.partialLease.tenantSurface);
        const otherTenantsSurface = positive(input.partialLease.otherTenantsSurface);
        if (tenantSurface + otherTenantsSurface === 0) {
            issues.push("Locazione parziale: indicare le superfici in uso esclusivo.");
        } else {
            const sharedSurface = totalSurface - tenantSurface - otherTenantsSurface;
            if (sharedSurface < 0) {
                warnings.push(
                    "Le superfici in uso esclusivo superano la superficie complessiva dell'unità abitativa.",
                );
            }
            const share = tenantSurface / (tenantSurface + otherTenantsSurface);
            result.partialLease = {
                share,
                sharedSurface,
                monthly: scaleRange(result.monthly, share),
                annual: scaleRange(result.annual, share),
            };
        }
    }

    return result;
}
