import type {
    AccordDefinition,
    ClassificationParameter,
    ClassificationThresholds,
    FasciaRates,
    SurchargeDefinition,
} from "./types.ts";

// Accordo territoriale per la Provincia di Como (escluso il Comune di Como), stipulato il 2 settembre 2003.
// Rates come from attachment 2: one row per year, valid from October of that year to September of the next.

/** minima [min, max], media [min, max], massima [min, max] */
type RateRow = readonly [number, number, number, number, number, number];

const FIRST_TABLE_YEAR = 2003;

/** Rows are the years from 2003 on, in order. */
const RATES_BY_YEAR: readonly RateRow[] = [
    [2.02, 3.18, 3.33, 5.05, 5.24, 7.92], // 2003
    [2.05, 3.23, 3.39, 5.13, 5.33, 8.05], // 2004
    [2.08, 3.27, 3.43, 5.2, 5.39, 8.15], // 2005
    [2.11, 3.32, 3.48, 5.28, 5.48, 8.28], // 2006
    [2.14, 3.36, 3.52, 5.34, 5.54, 8.38], // 2007
    [2.2, 3.46, 3.62, 5.5, 5.7, 8.62], // 2008
    [2.2, 3.47, 3.63, 5.51, 5.72, 8.64], // 2009
    [2.23, 3.51, 3.67, 5.57, 5.78, 8.73], // 2010
    [2.27, 3.58, 3.75, 5.69, 5.9, 8.92], // 2011
    [2.33, 3.67, 3.84, 5.82, 6.04, 9.13], // 2012
    [2.35, 3.7, 3.88, 5.88, 6.1, 9.22], // 2013
    [2.36, 3.71, 3.89, 5.89, 6.12, 9.24], // 2014
    [2.36, 3.71, 3.88, 5.89, 6.11, 9.24], // 2015
    [2.35, 3.7, 3.87, 5.88, 6.1, 9.22], // 2016
    [2.37, 3.73, 3.91, 5.93, 6.15, 9.3], // 2017
    [2.39, 3.77, 3.94, 5.98, 6.21, 9.38], // 2018
    [2.44, 3.85, 4.03, 6.11, 6.34, 9.58], // 2019
    [2.44, 3.85, 4.03, 6.11, 6.34, 9.58], // 2020
    [2.46, 3.88, 4.06, 6.16, 6.39, 9.66], // 2021
    [2.61, 4.1, 4.3, 6.52, 6.76, 10.22], // 2022
    [2.72, 4.29, 4.49, 6.81, 7.07, 10.68], // 2023
    [2.74, 4.31, 4.52, 6.85, 7.11, 10.74], // 2024
    [2.77, 4.37, 4.57, 6.94, 7.2, 10.88], // 2025
    [2.83, 4.45, 4.67, 7.08, 7.35, 11.1], // 2026
];

const toFasciaRates = ([a, b, c, d, e, f]: RateRow): FasciaRates => ({
    minima: { min: a, max: b },
    media: { min: c, max: d },
    massima: { min: e, max: f },
});

/** The rates change every October: the table of year Y applies from October Y to September Y+1. */
const referenceYear = (isoDate: string) => {
    const [year, month] = isoDate.split("-").map(Number);
    return month >= 10 ? year : year - 1;
};

const coreParameters: readonly ClassificationParameter[] = [
    { number: 1, label: "Autorimessa e/o posto auto coperto e/o posto auto scoperto" },
    { number: 2, label: "Sottotetto e/o soffitta e/o cantina in uso esclusivo" },
    { number: 3, label: "Impianto di riscaldamento con almeno una unità radiante per ogni locale" },
    { number: 4, label: "Impianto TV canalizzato" },
    { number: 5, label: "Serramenti e infissi a perfetta tenuta per gli agenti atmosferici" },
    { number: 6, label: "Ascensore" },
    { number: 7, label: "Doppi servizi" },
];

const extraParameters: readonly ClassificationParameter[] = [
    { number: 8, label: "Area verde e/o cortile comune, di almeno mq. 30 complessivi usufruibili" },
    { number: 9, label: "Impianto di condizionamento" },
    { number: 10, label: "Impianto elettrico a norma di legge" },
    { number: 11, label: "Appartamento sito in immobile con non più di 6 unità" },
    { number: 12, label: "Terrazza e/o balcone" },
    { number: 13, label: "Impianto del gas" },
];

const thresholds: ClassificationThresholds = {
    large: { low: { maximumCore: 5, mediumTotal: 8 }, high: { maximumCore: 6, mediumTotal: 9 } },
    medium: { low: { maximumCore: 4, mediumTotal: 7 }, high: { maximumCore: 5, mediumTotal: 8 } },
    small: { low: { maximumCore: 3, mediumTotal: 6 }, high: { maximumCore: 4, mediumTotal: 7 } },
};

const SMALL_UNIT_LIMIT = 55;

const surcharges: readonly SurchargeDefinition[] = [
    {
        id: "smallUnit",
        kind: "range",
        label: "Appartamento con superficie calpestabile inferiore a 55 mq",
        description:
            "Le fasce subiscono, nei valori minimi e massimi, un aumento fino al 15%. Indicare la percentuale applicata.",
        maxPercent: 15,
        isAvailable: ({ netSurface }) => netSurface > 0 && netSurface < SMALL_UNIT_LIMIT,
        unavailableReason: "Disponibile solo per superfici calpestabili inferiori a 55 mq.",
    },
    {
        id: "duration",
        kind: "select",
        label: "Durata contrattuale",
        description:
            "Per durate superiori a tre anni: +2% (4 anni), +4% (5 anni), +6% (6 anni e oltre), per l'intera durata.",
        options: [
            { value: "3", label: "3 anni (durata minima)", percent: 0 },
            { value: "4", label: "4 anni", percent: 2 },
            { value: "5", label: "5 anni", percent: 4 },
            { value: "6", label: "6 anni e oltre", percent: 6 },
        ],
    },
    {
        id: "historic",
        kind: "toggle",
        label: "Immobile storico",
        description:
            "Immobili di cui all'art. 1, comma 2, lett. a), L. 431/98. Aumento del 10% per l'intera durata, cumulabile con le altre maggiorazioni.",
        percent: () => 10,
    },
    {
        id: "furnished",
        kind: "range",
        label: "Arredamento sufficiente alla vivibilità",
        description:
            "Le fasce subiscono, nei valori minimi e massimi, un aumento fino al 15%. Indicare la percentuale applicata.",
        maxPercent: 15,
    },
];

export const PROVINCIA_2003: AccordDefinition = {
    id: "provincia-2003",
    territory: "province",
    territoryLabel: "Provincia di Como",
    agreementTitle: "Accordo territoriale per la Provincia di Como",
    validFrom: "2003-09-02",
    referenceText: "stipulato in data 02/09/2003",
    zones: [],
    surfaceItems: [
        {
            id: "greenArea",
            label: "Area verde ad uso esclusivo",
            coefficient: 0.15,
        },
        {
            id: "accessories",
            label: "Balconi, terrazze, cantine e posti auto",
            coefficient: 0.25,
        },
        { id: "singleGarage", label: "Autorimessa singola", coefficient: 0.5 },
    ],
    smallUnitBonus: null,
    coreParameters,
    extraParameters,
    noIndoorBathroomLabel: "Servizi igienici non interni all'abitazione",
    thresholds,
    noIndoorBathroomMaxFactor: 1.05,
    rates: ({ date }) => {
        const year = referenceYear(date);
        const row = RATES_BY_YEAR[year - FIRST_TABLE_YEAR];
        if (!row) {
            return {
                found: false,
                reason:
                    year < FIRST_TABLE_YEAR
                        ? "Nessuna tabella dei canoni per date precedenti all'accordo."
                        : `La tabella dei canoni per il ${year} non è ancora disponibile: va aggiunta in src/lib/accords/provincia-2003.ts.`,
            };
        }
        return {
            found: true,
            rates: toFasciaRates(row),
            label: `Tabella ${year} (da ottobre ${year} a settembre ${year + 1})`,
        };
    },
    surcharges,
    usesIstat: false,
    ratesNote:
        "Canoni al mq della tabella annuale dell'accordo, già adeguati all'indice ISTAT (75%) di ogni anno.",
};
