/** An accord covers either the city of Como or the rest of the province. */
export type Territory = "city" | "province";

export type Fascia = "minima" | "media" | "massima";
export type SizeBand = "small" | "medium" | "large";
export type FloorBand = "low" | "high";

export interface SurfaceItem {
    id: string;
    label: string;
    /** Share of the area that counts towards the conventional surface (0-1). */
    coefficient: number;
    description?: string;
}

export interface ClassificationParameter {
    /** Number used by the accord (1-13). */
    number: number;
    label: string;
}

export interface FasciaThresholds {
    /** Parameters needed among the "core" ones (1-7) for the maximum fascia. */
    maximumCore: number;
    /** Parameters needed among all of them (1-13) for the medium fascia. */
    mediumTotal: number;
}

export type ClassificationThresholds = Record<SizeBand, Record<FloorBand, FasciaThresholds>>;

export interface RateRange {
    min: number;
    max: number;
}

/** Monthly rent per square meter, for each fascia. */
export type FasciaRates = Record<Fascia, RateRange>;

export interface RateContext {
    /** Contract date (ISO). */
    date: string;
    zone: number | null;
    conventionalSurface: number;
}

/** What the user chose for a surcharge. Its meaning depends on the surcharge kind. */
export type SurchargeValue = boolean | string | number | null;

interface SurchargeBase {
    id: string;
    label: string;
    description: string;
}

export interface ToggleSurcharge extends SurchargeBase {
    kind: "toggle";
    /** Percent applied when the toggle is on (negative for a reduction). */
    percent: (context: SurchargeContext) => number;
    isAvailable?: (context: SurchargeContext) => boolean;
    unavailableReason?: string;
}

export interface SelectSurcharge extends SurchargeBase {
    kind: "select";
    options: readonly { value: string; label: string; percent: number }[];
}

/** An increase of "up to" a maximum percentage, chosen by the user. */
export interface RangeSurcharge extends SurchargeBase {
    kind: "range";
    maxPercent: number;
    isAvailable?: (context: SurchargeContext) => boolean;
    unavailableReason?: string;
}

export type SurchargeDefinition = ToggleSurcharge | SelectSurcharge | RangeSurcharge;

export interface SurchargeContext {
    netSurface: number;
}

export interface AccordDefinition {
    id: string;
    territory: Territory;
    /** Short name, e.g. "Comune di Como". */
    territoryLabel: string;
    /** The accord is used for contracts signed on or after this date (ISO). */
    validFrom: string;
    /** Full title used in documents, e.g. "Accordo territoriale per il Comune di Como". */
    agreementTitle: string;
    /** Sentence fragment used in documents, e.g. "depositato il 06/10/2020". */
    referenceText: string;
    zones: readonly { value: number; label: string }[];
    /** Documents that help find the zone of an address, linked under the zone field. */
    zoneLinks: readonly { label: string; href: string }[];
    surfaceItems: readonly SurfaceItem[];
    smallUnitBonus: ((netSurface: number, zone: number | null) => SmallUnitBonus) | null;
    coreParameters: readonly ClassificationParameter[];
    extraParameters: readonly ClassificationParameter[];
    /** Parameter that forces the minimum fascia, e.g. bathroom outside the apartment. */
    noIndoorBathroomLabel: string;
    thresholds: ClassificationThresholds;
    /** Maximum rent when no indoor bathroom: minimum rent times this factor. */
    noIndoorBathroomMaxFactor: number;
    rates: (context: RateContext) => RateLookup;
    surcharges: readonly SurchargeDefinition[];
    /** Whether rents are revalued with the ISTAT coefficients stored in the database. */
    usesIstat: boolean;
    /** Name of the revaluation basis, shown to the user. */
    ratesNote: string;
}

export interface SmallUnitBonus {
    percent: number;
    /** Extra square meters added to the net surface. */
    area: number;
}

export type RateLookup =
    | { found: true; rates: FasciaRates; label: string }
    | { found: false; reason: string };

export interface IstatIndex {
    /** ISO date from which the coefficient applies. */
    validFrom: string;
    coefficient: number;
}

export interface PartialLease {
    /** Surface in exclusive use of the tenant. */
    tenantSurface: number;
    /** Surface in exclusive use of other tenants. */
    otherTenantsSurface: number;
}

export interface CalculationInput {
    /** Date the contract is signed (ISO). */
    contractDate: string;
    zone: number | null;
    floor: number;
    /** Net walkable surface (`net`) and the other areas, keyed by surface item id. */
    surfaces: Record<string, number>;
    /** Numbers of the classification parameters that apply (1-13). */
    parameters: number[];
    noIndoorBathroom: boolean;
    /**
     * Lowers the fascia found from the classification, e.g. when the apartment is not in the
     * excellent state of maintenance required by the maximum fascia. Null keeps the automatic one.
     */
    fasciaOverride: Fascia | null;
    surcharges: Record<string, SurchargeValue>;
    partialLease: PartialLease | null;
}

export interface SurfaceLine {
    id: string;
    label: string;
    area: number;
    coefficient: number;
    convertedArea: number;
}

export interface AppliedSurcharge {
    id: string;
    label: string;
    percent: number;
}

export interface IstatResult {
    coefficient: number;
    /** Date of the index row that was used. */
    validFrom: string | null;
    /** True when the table has no row for the month of the contract. */
    isOutdated: boolean;
}

export interface MoneyRange {
    min: number;
    max: number;
}

export interface CalculationResult {
    accordId: string;
    /** Missing or inconsistent data that prevents the calculation. */
    issues: string[];
    /** Non-blocking remarks. */
    warnings: string[];
    surface: {
        lines: SurfaceLine[];
        smallUnitBonusPercent: number;
        smallUnitBonusArea: number;
        total: number;
    } | null;
    classification: {
        sizeBand: SizeBand;
        floorBand: FloorBand;
        coreCount: number;
        extraCount: number;
        totalCount: number;
        /** The fascia that applies (the override, if one was chosen). */
        fascia: Fascia;
        /** The fascia that follows from the classification alone. */
        automaticFascia: Fascia;
    } | null;
    rateSource: string | null;
    baseRate: MoneyRange | null;
    surcharges: AppliedSurcharge[];
    totalSurchargePercent: number;
    istat: IstatResult | null;
    ratePerSquareMeter: MoneyRange | null;
    monthly: MoneyRange | null;
    annual: MoneyRange | null;
    partialLease: {
        share: number;
        sharedSurface: number;
        monthly: MoneyRange;
        annual: MoneyRange;
    } | null;
}
