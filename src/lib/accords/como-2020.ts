import type {
    AccordDefinition,
    ClassificationParameter,
    ClassificationThresholds,
    FasciaRates,
    SurchargeDefinition,
} from "./types.ts";

// Accordo territoriale per il Comune di Como, depositato il 06/10/2020.
// Rates come from attachments 5 (up to 60 sqm) and 6 (over 60 sqm) of the accord.

/** minima [min, max], media [min, max], massima [min, max] */
type RateRow = readonly [number, number, number, number, number, number];

/** Rows are microzones 1 to 6. */
const RATES_UP_TO_60_SQM: readonly RateRow[] = [
    [4, 8.7, 6, 11.25, 8, 15.1],
    [3, 6.8, 4.5, 9.3, 6.5, 11.25],
    [3, 4.5, 3, 6.8, 4.5, 8.4],
    [3, 5.5, 4, 6.8, 4.6, 8.8],
    [3, 6.2, 4, 9.5, 6, 11.3],
    [3, 6, 4, 7.9, 5, 8.6],
];

const RATES_OVER_60_SQM: readonly RateRow[] = [
    [4, 8.5, 5.5, 11.2, 8, 14.8],
    [3, 6.7, 4, 9.3, 6, 11.1],
    [2.5, 4.9, 3, 6.5, 4.5, 8.3],
    [3, 5.3, 4, 6.9, 6, 8.6],
    [3, 5.9, 4, 9.3, 6, 11.4],
    [3, 6, 4, 7.9, 5, 8.6],
];

const toFasciaRates = ([a, b, c, d, e, f]: RateRow): FasciaRates => ({
    minima: { min: a, max: b },
    media: { min: c, max: d },
    massima: { min: e, max: f },
});

const SMALL_UNIT_SURFACE_CAP = 62;

const coreParameters: readonly ClassificationParameter[] = [
    { number: 1, label: "Autorimessa e/o posto auto coperto e/o posto auto scoperto" },
    { number: 2, label: "Sottotetto e/o soffitta e/o cantina in uso esclusivo" },
    {
        number: 3,
        label: "Sanitari e relativi accessori integri ed in buono stato di manutenzione, al momento della sottoscrizione del contratto",
    },
    { number: 4, label: "Impianto TV canalizzato" },
    { number: 5, label: "Porta blindata" },
    { number: 6, label: "Ascensore" },
    { number: 7, label: "Doppi servizi" },
];

const extraParameters: readonly ClassificationParameter[] = [
    { number: 8, label: "Area verde e/o cortile comune, di almeno mq. 30 complessivi usufruibili" },
    { number: 9, label: "Impianto di climatizzazione estiva o raffrescamento" },
    { number: 10, label: "Sistema di allarme o inferriate di sicurezza" },
    { number: 11, label: "Appartamento sito in immobile con non più di 6 unità" },
    { number: 12, label: "Terrazza/balcone" },
    { number: 13, label: "Dotazione di impianto a pompa di calore e/o geotermico e/o fotovoltaico" },
];

const thresholds: ClassificationThresholds = {
    large: { low: { maximumCore: 5, mediumTotal: 7 }, high: { maximumCore: 6, mediumTotal: 8 } },
    medium: { low: { maximumCore: 4, mediumTotal: 6 }, high: { maximumCore: 5, mediumTotal: 7 } },
    small: { low: { maximumCore: 3, mediumTotal: 5 }, high: { maximumCore: 4, mediumTotal: 6 } },
};

const surcharges: readonly SurchargeDefinition[] = [
    {
        id: "historic",
        kind: "toggle",
        label: "Immobile storico",
        description:
            "Immobili di cui all'art. 1, comma 2, lett. a), L. 431/98. Aumento del 10% per l'intera durata contrattuale, cumulabile con le altre maggiorazioni.",
        percent: () => 10,
    },
    {
        id: "furnished",
        kind: "toggle",
        label: "Arredamento sufficiente alla vivibilità",
        description:
            "Elementi per preparare e conservare il cibo con superficie di appoggio, letto e armadio a due o più ante. Aumento del 20% fino a 55 mq calpestabili, del 15% oltre.",
        percent: ({ netSurface }) => (netSurface <= 55 ? 20 : 15),
    },
    {
        id: "energyClass",
        kind: "select",
        label: "Classe energetica",
        description:
            "Come certificato dall'Attestato di Prestazione Energetica. Classi A, B, C: +10%. Classi D, E: +5%.",
        options: [
            { value: "none", label: "Classe F, G o non certificata", percent: 0 },
            { value: "A", label: "Classe A", percent: 10 },
            { value: "B", label: "Classe B", percent: 10 },
            { value: "C", label: "Classe C", percent: 10 },
            { value: "D", label: "Classe D", percent: 5 },
            { value: "E", label: "Classe E", percent: 5 },
        ],
    },
    {
        id: "duration",
        kind: "select",
        label: "Durata contrattuale",
        description: "Per durate superiori a tre anni: +5% (4 anni), +8% (5 anni), +10% (6 anni e oltre).",
        options: [
            { value: "3", label: "3 anni (durata minima)", percent: 0 },
            { value: "4", label: "4 anni", percent: 5 },
            { value: "5", label: "5 anni", percent: 8 },
            { value: "6", label: "6 anni e oltre", percent: 10 },
        ],
    },
    {
        id: "electricHeating",
        kind: "toggle",
        label: "Riscaldamento con sole stufette",
        description:
            "Riscaldamento fornito unicamente da stufette elettriche portatili o da stufe a combustibile liquido. Riduzione del 10%.",
        percent: () => -10,
    },
];

export const COMO_2020: AccordDefinition = {
    id: "como-2020",
    territory: "city",
    territoryLabel: "Comune di Como",
    agreementTitle: "Accordo territoriale per il Comune di Como",
    validFrom: "2020-10-06",
    referenceText: "depositato in data 06/10/2020",
    zones: [1, 2, 3, 4, 5, 6].map((value) => ({ value, label: `Microzona ${value}` })),
    zoneHelp: {
        text: "L'ubicazione dell'immobile si individua dallo stradario e dalla planimetria delle microzone allegati all'accordo.",
        links: [
            { label: "Stradario", href: "/docs/AT1.pdf" },
            { label: "Planimetria microzone", href: "/docs/AT3.pdf" },
        ],
    },
    surfaceItems: [
        { id: "singleGarage", label: "Autorimessa singola", coefficient: 0.7 },
        { id: "sharedParking", label: "Posto auto in autorimessa comune", coefficient: 0.5 },
        {
            id: "accessories",
            label: "Balconi, terrazzi, cantine, solai e posti auto scoperti in uso esclusivo",
            coefficient: 0.25,
        },
        { id: "outdoorArea", label: "Area scoperta di pertinenza esclusiva", coefficient: 0.1 },
    ],
    smallUnitBonus: (netSurface, zone) => {
        const percent =
            netSurface <= 30 ? (zone === 2 ? 35 : 30) : netSurface <= 45 ? 25 : netSurface <= 60 ? 15 : 0;
        if (percent === 0 || netSurface > 60) return { percent: 0, area: 0 };

        const bonus = (netSurface * percent) / 100;
        return {
            percent,
            area: netSurface + bonus >= SMALL_UNIT_SURFACE_CAP ? SMALL_UNIT_SURFACE_CAP - netSurface : bonus,
        };
    },
    coreParameters,
    extraParameters,
    noIndoorBathroomLabel: "Servizi igienici non interni all'abitazione",
    thresholds,
    noIndoorBathroomMaxFactor: 1.05,
    rates: ({ zone, conventionalSurface }) => {
        const table = conventionalSurface <= 60 ? RATES_UP_TO_60_SQM : RATES_OVER_60_SQM;
        const row = zone === null ? undefined : table[zone - 1];
        if (!row) return { found: false, reason: "Microzona non valida." };
        return {
            found: true,
            rates: toFasciaRates(row),
            label: conventionalSurface <= 60 ? "Immobili fino a 60 mq" : "Immobili oltre 60 mq",
        };
    },
    surcharges,
    usesIstat: true,
    ratesNote:
        "Canoni al mq dell'accordo, rivalutati con l'indice ISTAT in vigore nel mese di stipula del contratto.",
};
