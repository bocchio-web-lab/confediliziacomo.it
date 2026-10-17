import { pdf, type DocumentLink } from "./types.ts";

export const REGISTER_REFERENCES: readonly DocumentLink[] = [
    {
        title: "Registro nazionale amministratori Confedilizia",
        href: "http://www.confedilizia.it/CORAM.HTML",
    },
    {
        title: "Regolamento deontologico amministratori di condominio Confedilizia",
        href: pdf("Deontologiaamministratoricondominioconfedilizia.pdf"),
    },
    {
        title: "Regolamento registro amministratori",
        href: pdf("Regolamentoregistroamministratori.pdf"),
    },
];

export const STANDARD_ACCOUNTING_REPORT = [
    "Le associazioni di amministratori di condominio Agiai e Gesticond, unitamente al Coram (Coordinamento Registri Amministratori Confedilizia) ed alla stessa Confedilizia, hanno predisposto un rendiconto tipo per gli amministratori condominiali, che tiene conto dell'elaborazione pluriennale della giurisprudenza e prevede quindi anche indicazioni non espressamente stabilite dalla legge ma da ritenersi ormai obbligatorie.",
    "Il documento predisposto dalle quattro organizzazioni si prefigge anche lo scopo di fornire ai condomini sempre la massima chiarezza.",
    "Presso la nostra sede si potranno avere ulteriori chiarimenti nonché uno stampato del rendiconto tipo.",
] as const;
