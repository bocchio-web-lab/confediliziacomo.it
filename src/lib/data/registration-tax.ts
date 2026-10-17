export interface TaxCode {
    code: string;
    description: string;
}

export const ANNUAL_TAX_RATE = "2%";
export const MINIMUM_TAX = "€ 67,00";
export const MINIMUM_TAX_NOTE = "solo per la prima annualità";

export const ROUNDING_RULE = {
    description:
        "Da arrotondare al centesimo, per difetto se il terzo decimale è inferiore a 5, altrimenti per eccesso.",
    examples: ["€ 49,494 = € 49,49", "€ 49,495 = € 49,50"],
} as const;

export const LEASE_TAX_CODES: readonly TaxCode[] = [
    { code: "1500", description: "Prima annualità" },
    { code: "1501", description: "Annualità successive" },
    { code: "1502", description: "Cessione contratto" },
    { code: "1503", description: "Risoluzione anticipata" },
    { code: "1504", description: "Proroghe contratti - intero periodo" },
    { code: "1505", description: "Imposta di bollo" },
];

export const LOAN_FOR_USE = {
    title: "Contratto di comodato",
    note: "Se in forma scritta, si registra entro 20 giorni.",
    fixedTax: "€ 200,00 - Mod. F24",
    code: "1550",
} as const;

export const REGISTRY_OFFICE_CODES: readonly TaxCode[] = [
    { code: "R.P.", description: "Prima registrazione" },
    { code: "TMX", description: "Ufficio Registro di Como" },
    { code: "TMM", description: "Ufficio Registro di Cantù" },
    { code: "TM5", description: "Ufficio Registro di Erba" },
];
