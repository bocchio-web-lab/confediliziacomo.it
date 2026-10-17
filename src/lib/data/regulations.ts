import { pdf, type DocumentLink } from "./types.ts";

export const REGULATIONS_UPDATED_AT = "Ottobre 2026";

export const TAX_CALENDAR: readonly DocumentLink[] = [
    {
        title: "Scadenzario tributario ottobre 2026",
        href: pdf("Scadenzario1026.pdf"),
    },
];

export const NEWS: readonly DocumentLink[] = [
    {
        title: "Disposizioni Ag. E.te 18.4.2019",
        description: "Modalità cessione del credito per riqualificazioni energetiche",
        href: pdf("Agenziaentrate180419.pdf"),
    },
    {
        title: "Modello dichiarazione di cessione del credito",
        description: "Da far pervenire all'Agenzia delle Entrate",
        href: pdf("Modulodichiarazionecessionedelcredito.pdf"),
    },
    {
        title: "Chiarimenti Dr. Valeria Pessina",
        description: "Modalità cessione del credito - in breve - Aprile 2019",
        href: pdf("ChiarimentiDrValeriaPessina0419.pdf"),
    },
    {
        title: "Risoluzione 28 dicembre 2020, n. 83/E",
        description: "Nuovi codici per modello F24",
        href: pdf("Risoluzione281220.pdf"),
    },
    {
        title: "Nuovo Modello RLI",
        description: "Registrazione contratti di locazione di immobili dal 29.9.17",
        href: pdf("RLI0917.pdf"),
    },
    {
        title: "Disposizioni Ag. E.te 28.8.2017",
        description: "Modalità cessione del credito per riqualificazioni energetiche",
        href: pdf("Agenziaentrate280817.pdf"),
    },
    {
        title: "Chiarimenti Dr. Valeria Pessina",
        description: "Modalità cessione del credito - in breve - Agosto 2017",
        href: pdf("ChiarimentiDrValeriaPessina.pdf"),
    },
];

export const BASEMENT_RECOVERY: readonly DocumentLink[] = [
    {
        title: "Legge regionale 10 marzo 2017 n. 17",
        href: pdf("Leggeregionale10032017.pdf"),
    },
];

export const OPINIONS: readonly DocumentLink[] = [
    {
        title: "Agevolazioni fiscali contratti a canone concordato - Comune di Como",
        description: "Relazione Dr. Valeria Pessina",
        href: pdf("Parere0226DottValeriaPessina.pdf"),
    },
    {
        title: "Divieto regolamentare di destinare l'immobile ad uso pensione",
        description: "Parere Avv. Alessio Galvagno",
        href: pdf("Parere0123avvAlessioGalvagno.pdf"),
    },
];

export const CONDOMINIUM_REFORM: readonly DocumentLink[] = [
    {
        title: "Legge di riforma del condominio",
        href: pdf("Riformacondominio.pdf"),
    },
    {
        title: "Sintesi dei punti qualificanti della riforma",
        href: pdf("Sintesiriformacondominio.pdf"),
    },
    {
        title: "Comunicazione all'amministratore ex art. 1130 c.c.",
        href: pdf("Comunicazioneamministratore1130.pdf"),
    },
];

export const CONDOMINIUM_REFORM_NOTE = "Servizio visure catastali nella nostra sede.";

export const FLAT_TAX: readonly DocumentLink[] = [
    {
        title: "Cedolare secca commerciale 2019",
        description: "Regime della cedolare secca commerciale 2019",
        href: pdf("Cedolareseccacommerciale2019.pdf"),
    },
    {
        title: "Disp. Ag. E.te 7.4.2011",
        description: "Modalità d'esercizio dell'opzione per il regime della cedolare secca",
        href: pdf("Cedolaresecca.PDF"),
    },
    {
        title: "Circolare Agenzia Entrate 26/E - 1.6.2011",
        description: "Primi chiarimenti sulla cedolare secca",
        href: pdf("Agenziaentrate010611.pdf"),
    },
    {
        title: "Adempimenti cedolare secca - 29.6.2011",
        description: "Circolare Confedilizia",
        href: pdf("Adempimenticedolaresecca.pdf"),
    },
];

export const FLAT_TAX_NOTE = "Modulistica per cedolare secca nella nostra sede.";

export const TERRITORIAL_AGREEMENT_2020 = {
    main: {
        title: "Nuovo accordo 2020 contratti agevolati 3+2",
        description: "Per la città di Como (depositato 6.10.2020)",
        href: pdf("AT0.pdf"),
    },
    attachments: [
        { title: "Stradario", href: pdf("AT1.pdf") },
        { title: "Microzona 1", href: pdf("AT2Microzona1.pdf") },
        { title: "Microzona 2", href: pdf("AT2Microzona2.pdf") },
        { title: "Microzona 3", href: pdf("AT2Microzona3.pdf") },
        { title: "Microzona 4", href: pdf("AT2Microzona4.pdf") },
        { title: "Microzona 5", href: pdf("AT2Microzona5.pdf") },
        { title: "Microzona 6", href: pdf("AT2Microzona6.pdf") },
        { title: "Planimetria microzone", href: pdf("AT3.pdf") },
        { title: "Elementi class. immobile", href: pdf("AT4.pdf") },
        { title: "Immobili fino a 60 mq", href: pdf("AT5.pdf") },
        { title: "Immobili oltre 60 mq", href: pdf("AT6.pdf") },
        { title: "Ripartizione spese condominiali", href: pdf("AT7.pdf") },
        { title: "Contratto abitazione", href: pdf("AT8.pdf") },
        { title: "Contratto transitorio", href: pdf("AT9.pdf") },
        { title: "Contratto universitari", href: pdf("AT10.pdf") },
        { title: "Richiesta di conciliazione", href: pdf("AT11.pdf") },
        { title: "Attestazione ex D.M. 16.1.2017", href: pdf("AT12.pdf") },
        {
            title: "ISTAT ottobre 2023 per canoni concordati di Como",
            href: pdf("ISTAT_ottobre2023_canoni_concordati_Como.pdf"),
        },
    ],
} as const satisfies { main: DocumentLink; attachments: readonly DocumentLink[] };

export const TERRITORIAL_AGREEMENTS: readonly DocumentLink[] = [
    {
        title: "Accordo per i contratti agevolati 3+2",
        description: "Per la città di Como - aggiornato fino al 2019",
        href: pdf("Contrattiagevolaticomo.pdf"),
    },
    {
        title: "Accordo per i contratti agevolati 3+2",
        description: "Per la provincia di Como - aggiornato fino al 2026",
        href: pdf("Contrattiagevolatiprovinciacomo2026.pdf"),
    },
];

export const MEMBER_CIRCULARS_PERIOD = "Ultimi tre anni";

export const MEMBER_CIRCULARS: readonly DocumentLink[] = [
    {
        title: "Circolare maggio 2025",
        description: "Aggiornamenti per gli associati e assemblea annuale",
        href: pdf("Circolare0525.pdf"),
    },
    {
        title: "Circolare maggio 2024",
        description: "Aggiornamenti per gli associati",
        href: pdf("Circolare0524.pdf"),
    },
];
