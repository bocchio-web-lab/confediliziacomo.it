import { pdf, type DocumentLink, type PricedItem } from "./types.ts";

export const MEMBER_SERVICES: readonly string[] = [
    "Consulenze in sede su locazioni, condomini e questioni immobiliari in genere.",
    "Assistenza in tutte le incombenze connesse alla locazione (aggiornamenti ISTAT, visure catastali, ecc.).",
    "Risposte scritte a quesiti richiesti via posta normale o elettronica.",
    "Consulenze, in sede, di professionisti: si possono fissare sino a 15 incontri gratuiti con i nostri consulenti legali, notarili, fiscali e tecnici.",
    "Visure catastali ed ipotecarie gratuite.",
    "Consulenza in materia termotecnica, di sicurezza sul lavoro e antincendio.",
    "Modulistica per contratti di locazione in formato PDF.",
    "Consulenza assicurativa personalizzata.",
    "Invio di circolari informative periodiche e abbonamento al periodico mensile Confedilizia Notizie.",
    "Organizzazione di convegni ed incontri, in occasione di novità normative riguardanti gli immobili.",
];

export const MEMBER_SERVICES_LINKS: readonly DocumentLink[] = [
    {
        title: "Regolamento consulenze",
        href: pdf("Regolamentoconsulenze.pdf"),
    },
    {
        title: "Elenco consulenti",
        href: "/consulenti",
    },
];

export const PAID_SERVICES: readonly PricedItem[] = [
    {
        label: "Assistenza di un legale alla stipulazione del contratto di locazione",
        price: "€ 50,00 per ciascuna delle parti",
    },
    {
        label: "Compilazione, da parte della segreteria, del contratto di locazione 6+6 e 4+4",
        price: "€ 70,00",
    },
    {
        label: "Compilazione, da parte della segreteria, del contratto di locazione 3+2",
        price: "€ 75,00",
    },
    {
        label: "Prospetto di calcolo canone concordato Como e provincia di Como",
        price: "€ 25,00",
    },
    {
        label: "Registrazione contratto redatto da Confedilizia",
        price: "€ 20,00",
    },
    {
        label: "Registrazione contratto non redatto da Confedilizia",
        price: "€ 30,00",
    },
    {
        label: "Registrazione adempimenti successivi (proroga, risoluzione, riduzione canone, ecc.)",
        price: "€ 30,00",
    },
    {
        label: "PEC di chiarimento con Ufficio Registro (contratti non agganciati, proroghe rigettate, ecc.)",
        price: "€ 20,00",
    },
    {
        label: "Consegna della modulistica agli uffici",
        price: "€ 30,00",
    },
    {
        label: "Redazione di una lettera o di un parere da parte di un consulente",
        price: "€ 25,00 + spese postali",
    },
    {
        label: "Redazione di un parere legale/fiscale/tecnico",
        price: "€ 40,00",
    },
    {
        label: "Compilazione Mod. F24",
        price: "€ 5,00",
    },
    {
        label: "Compilazione RLI con F24 - Mod. 69 e comunicazione cessione fabbricato",
        price: "€ 10,00",
    },
    {
        label: "PEC a Comune per invio dichiarazione IMU",
        price: "€ 15,00",
    },
    {
        label: "PEC a Questura/Comune per comunicazione cessione fabbricato",
        price: "€ 15,00",
    },
    {
        label: "Modulistica: contratti di locazione cartaceo",
        price: "€ 5,00",
    },
    {
        label: "Procedure di conciliazione per gli associati",
        price: "Avvio procedura € 50,00; dalla controparte, se accetta, € 61,00 (IVA compresa)",
    },
    {
        label: "Richiesta di verifica di conformità normativa ed economica del contratto prima della stipula",
        price: "€ 35,00",
    },
    {
        label: "Attestazione di rispondenza ex D.M. 16/1/2017 su modello contrattuale Confedilizia/Ministeriale",
        price: "€ 25,00",
    },
];

export const NON_MEMBER_RATES: readonly PricedItem[] = [
    {
        label: "Attestazioni di rispondenza ex D.M. 16/1/2017",
        price: "€ 50,00 + IVA",
    },
    {
        label: "Dichiarazione di conformità economica e normativa canone concordato Provincia di Como",
        price: "€ 50,00 + IVA",
    },
    {
        label: "Prospetto di calcolo canone concordato Como e Provincia",
        price: "€ 40,00 + IVA",
    },
    {
        label: "Richiesta di verifica di conformità normativa ed economica del contratto, prima della stipula",
        price: "€ 70,00 + IVA",
    },
    {
        label: "Modulistica: contratti di locazione cartaceo e PDF",
        price: "€ 10,00 + IVA",
    },
];

export interface AgreedRentNote {
    audience: string;
    items: readonly string[];
}

export const AGREED_RENT_NOTES: readonly AgreedRentNote[] = [
    {
        audience: "Per i soci",
        items: [
            "Prospetto di calcolo canone concordato: € 25,00.",
            "Redazione del contratto di locazione: € 75,00.",
            "Sconto «richieste ravvicinate»: se il contratto viene richiesto entro 1 mese dal prospetto, gli € 25,00 già pagati vengono scalati e il contratto costerà quindi € 50,00. Oltre il mese la riduzione scade perché i dati potrebbero richiedere un aggiornamento.",
        ],
    },
    {
        audience: "Per i non soci",
        items: [
            "Prospetto di calcolo canone concordato: € 40,00 + IVA.",
            "Nessuno sconto ex post: se il non socio decide di associarsi dopo aver pagato il prospetto, non avrà diritto a sconti sulla successiva redazione del contratto.",
        ],
    },
];

export const MEETING_ROOM = {
    capacity: 12,
    details: [
        "L'ambiente è dotato di uno schermo grande, un servizio Wi-Fi ed eventualmente di un computer.",
        "Il prezzo ridotto è di € 50,00 più IVA, purché la prenotazione venga fatta da un socio o da un amministratore iscritto nell'apposito elenco. Per le assemblee condominiali la fattura verrà rilasciata al condominio.",
        "Orario del servizio dalle ore 9.00 alle 18.30 dal lunedì al venerdì.",
        "Chiedere alla segreteria per ulteriori informazioni.",
    ],
} as const;

export const EXTERNAL_SERVICES: readonly string[] = [
    "Certificazioni energetiche.",
    "Polizze assicurative.",
    "Elaborazione di paghe e contributi per portieri, colf e badanti.",
    "Compilazione di modelli 730 e Unico.",
    "Calcolo ripartizioni utenze (acquedotto, riscaldamento, ecc.).",
    "Redazione di regolamenti condominiali e tabelle millesimali.",
];

export const MEMBERSHIP_FEES_YEAR = "1 gennaio 2024";

export const MEMBERSHIP_FEES = [
    {
        label: "Un'unità immobiliare",
        price: "€ 90",
    },
    {
        label: "Più di un'unità immobiliare, locazioni commerciali, condomini, amministrazioni, società, studi professionali",
        price: "€ 110",
    },
    {
        label: "Diritti di segreteria per nuove iscrizioni",
        price: "€ 20",
    },
] as const;

export const MEMBERSHIP_NOTES: readonly string[] = [
    "Per le nuove iscrizioni, a partire dal 1° ottobre, la quota associativa prevista per l'anno solare sarà ridotta del 50%.",
    "Le iscrizioni (quota intera), dal 1° dicembre saranno valide per tutto l'anno successivo.",
    "La quota associativa è riferita all'anno solare ed ha validità dal 1° gennaio al 31 dicembre di ogni anno.",
];

export const BANK_DETAILS = {
    bank: "Crédit Agricole",
    iban: "IT32G0623010996000046769448",
} as const;
