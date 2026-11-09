import type { Content, ContentTable, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import type { AccordDefinition, CalculationResult, ClassificationParameter, Fascia } from "#lib/accords/types.ts";
import { LEASE_TYPES, leaseTypeOf, type DocumentData, type DocumentKind, type LeaseType } from "#lib/documents/types.ts";
import { formatDate, formatMoney, formatNumber, formatPercent } from "#lib/format.ts";
import { ORGANIZATION } from "./organization.ts";

export interface PdfInput {
    kind: DocumentKind;
    accord: AccordDefinition;
    data: DocumentData;
    /** Must be a complete calculation (no issues). */
    result: CalculationResult;
    /** Number of the saved document; null while it has not been saved yet. */
    documentNumber: number | null;
    /** Logo as a data URL. */
    logo: string;
    /** Signature and stamp as a data URL, printed on prospectuses only. */
    signature: string | null;
}

const numberLabel = (documentNumber: number | null) => `N. ${documentNumber ?? "……………"}`;

const BLANK = "…………………………";
const FASCIA_LABELS: Record<Fascia, string> = { minima: "MINIMA", media: "MEDIA", massima: "MASSIMA" };

const filled = (value: string | number | null | undefined, fallback = BLANK) =>
    value === null || value === undefined || value === "" ? fallback : String(value);

const heading = (text: string): Content => ({ text, style: "heading", margin: [0, 8, 0, 3] });

const keyValueRow = (label: string, value: string): TableCell[] => [
    { text: label },
    { text: value, alignment: "right", bold: true },
];

const lightLines = {
    hLineColor: () => "#cccccc",
    vLineColor: () => "#cccccc",
    paddingTop: () => 2,
    paddingBottom: () => 2,
};

function surfaceTable({ accord, result }: Pick<PdfInput, "accord" | "result">): ContentTable {
    const surface = result.surface!;
    const rows: TableCell[][] = [];

    for (const line of surface.lines) {
        rows.push([
            { text: line.label },
            { text: `${formatNumber(line.area)} mq`, alignment: "right" },
            { text: line.id === "net" ? "(100%)" : `(${formatNumber(line.coefficient * 100, 0)}%)`, alignment: "right" },
            { text: `${formatNumber(line.convertedArea)} mq`, alignment: "right" },
        ]);
        if (line.id === "net" && accord.smallUnitBonus) {
            rows.push([
                { text: "Maggiorazione per superficie inferiore o uguale a mq. 60:" },
                { text: "" },
                { text: surface.smallUnitBonusPercent ? `(${formatNumber(surface.smallUnitBonusPercent, 0)}%)` : "(0%)", alignment: "right" },
                { text: `${formatNumber(surface.smallUnitBonusArea)} mq`, alignment: "right" },
            ]);
        }
    }
    rows.push([
        { text: "TOTALE SUPERFICIE CONVENZIONALE", bold: true, colSpan: 3 },
        {},
        {},
        { text: `${formatNumber(surface.total)} mq`, alignment: "right", bold: true },
    ]);

    return { table: { widths: ["*", 60, 50, 70], body: rows }, layout: lightLines };
}

function classificationTable({ accord, data }: Pick<PdfInput, "accord" | "data">): Content {
    const selected = new Set(data.calculation.parameters);
    const cell = (parameter: ClassificationParameter): Content => ({
        columns: [
            { text: selected.has(parameter.number) ? "[X]" : "[  ]", width: 22, bold: true },
            { text: `${parameter.number}. ${parameter.label}`, width: "*" },
        ],
        columnGap: 4,
        margin: [0, 1, 0, 1],
    });

    const bathroom: Content = {
        columns: [
            { text: data.calculation.noIndoorBathroom ? "[X]" : "[  ]", width: 22, bold: true },
            { text: `- ${accord.noIndoorBathroomLabel}`, width: "*" },
        ],
        columnGap: 4,
        margin: [0, 4, 0, 2],
    };

    return {
        stack: [
            {
                columns: [
                    { stack: accord.coreParameters.map(cell), width: "*" },
                    { stack: accord.extraParameters.map(cell), width: "*" },
                ],
                columnGap: 16,
            },
            bathroom,
        ],
        fontSize: 8.5,
    };
}

function classificationSummary({ result, data, kind }: Pick<PdfInput, "result" | "data" | "kind">): Content {
    const classification = result.classification!;
    const isLowered = classification.fascia !== classification.automaticFascia;
    // The notes on the fascia are only part of attestations.
    const notes = kind === "attestation" ? data.details.fasciaNotes : "";

    return {
        stack: [
            {
                text: `Presenza di n. ${classification.coreCount} parametri da 1 a 7 e di n. ${classification.extraCount} parametri da 8 a 13 o di n. ${classification.totalCount} parametri da 1 a 13`,
                margin: [0, 6, 0, 2],
            },
            {
                text: [
                    { text: "FASCIA DI APPARTENENZA: " },
                    { text: FASCIA_LABELS[classification.fascia], bold: true },
                    ...(isLowered
                        ? [{ text: ` (fascia ${FASCIA_LABELS[classification.automaticFascia].toLowerCase()} in base ai parametri, ridotta per lo stato dell'immobile)`, fontSize: 8.5 }]
                        : []),
                ],
            },
            ...(notes ? [{ text: [{ text: "Note: ", bold: true }, { text: notes }], margin: [0, 3, 0, 0] } as Content] : []),
        ],
    };
}

/** One line per surcharge of the accord: "Sì"/"No" and the percentage actually applied. */
function surchargesTable({ accord, result }: Pick<PdfInput, "accord" | "result">): ContentTable {
    const applied = new Map(result.surcharges.map((surcharge) => [surcharge.id, surcharge.percent]));
    const rows = accord.surcharges.map((definition): TableCell[] => {
        const percent = applied.get(definition.id);
        return [
            { text: definition.label },
            { text: percent === undefined ? "NO" : `SÌ (${formatPercent(percent)})`, alignment: "right", bold: true },
        ];
    });
    return { table: { widths: ["*", 90], body: rows }, layout: lightLines };
}

const SIGNATURE_WIDTH = 100;
// The line to sign is drawn over the lower part of the image of the stamp.
const SIGNATURE_OVERLAP = 28;

function signatures(date: string, left: string, right: string, signature: string | null = null): Content {
    const dots: Content = { text: "………………………………........….", alignment: "center" };

    return {
        stack: [
            { text: `Como, lì ${date ? formatDate(date) : "……………………"}`, margin: [0, 12, 0, 0] },
            {
                columns: [
                    { text: left, alignment: "center" },
                    { text: right, alignment: "center" },
                ],
                margin: [0, 10, 0, 0],
            },
            signature
                ? {
                      columns: [
                          { text: "", width: "*" },
                          {
                              stack: [
                                  { image: signature, width: SIGNATURE_WIDTH, alignment: "center", margin: [0, 2, 0, -SIGNATURE_OVERLAP] },
                                  dots,
                              ],
                              width: "*",
                          },
                      ],
                  }
                : { columns: [dots, dots], margin: [0, 20, 0, 0] },
        ],
        unbreakable: true,
    };
}

function header({ logo, kind, documentNumber }: Pick<PdfInput, "logo" | "kind" | "documentNumber">): Content {
    return {
        columns: [
            { image: logo, width: 120 },
            { text: numberLabel(documentNumber), alignment: "right", margin: [0, 8, 0, 0] },
        ],
        margin: [0, 0, 0, kind === "prospectus" ? 4 : 0],
    };
}

function propertyLine({ data }: Pick<PdfInput, "data">) {
    const { details, calculation } = data;
    return `Unità abitativa sita in ${filled(details.address)}, piano ${calculation.floor}, int. ${filled(details.unit, "……")}`;
}

function istatNote({ result }: Pick<PdfInput, "result">): Content {
    if (!result.istat) return { text: "" };
    return {
        text: `Rivalutazione ISTAT applicata: coefficiente ${formatNumber(result.istat.coefficient, 3)} (in vigore dal ${formatDate(result.istat.validFrom)}).`,
        fontSize: 8,
        color: "#666666",
        margin: [0, 6, 0, 0],
    };
}

function partialLeasePage(input: PdfInput): Content[] {
    const { data, result, kind, accord } = input;
    const partial = result.partialLease!;
    const partialInput = data.calculation.partialLease!;
    const totalSurface = result.surface!.total;

    const surfaceRows: TableCell[][] = [
        keyValueRow("Superficie complessiva dell'unità abitativa", `${formatNumber(totalSurface)} mq`),
        keyValueRow("Superficie in uso esclusivo al conduttore", `${formatNumber(partialInput.tenantSurface)} mq`),
        keyValueRow("Superficie in uso esclusivo ad altri conduttori", `${formatNumber(partialInput.otherTenantsSurface)} mq`),
        keyValueRow("Superficie in uso condiviso tra tutti i conduttori", `${formatNumber(partial.sharedSurface)} mq`),
    ];

    if (kind === "prospectus") {
        return [
            { text: "PROSPETTO DI CALCOLO PER LOCAZIONI PARZIALI", style: "title", pageBreak: "before" },
            { table: { widths: ["*", 100], body: surfaceRows }, layout: lightLines, margin: [0, 12, 0, 0] },
            heading("CANONE MENSILE stabilito dall'Accordo Territoriale:"),
            {
                text: `minimo ${formatMoney(partial.monthly.min)} / massimo ${formatMoney(partial.monthly.max)}`,
                bold: true,
                fontSize: 12,
            },
            { text: "I dati sopra riportati sono stati forniti dal locatore.", margin: [0, 12, 0, 0] },
            signatures(data.details.issueDate, "", ORGANIZATION.name, input.signature),
        ];
    }

    const intro = attestationPremise(input);
    return [
        { text: "APPENDICE PER CONTRATTI PARZIALI", style: "title", pageBreak: "before" },
        { text: intro, margin: [0, 12, 0, 8], alignment: "justify" },
        { text: "DICHIARA", style: "heading", margin: [0, 8, 0, 4] },
        { table: { widths: ["*", 100], body: surfaceRows }, layout: lightLines },
        {
            text: `Che, quindi, il conduttore usufruisce del ${formatNumber(partial.share * 100)}% della superficie totale dell'unità abitativa.`,
            margin: [0, 8, 0, 8],
        },
        {
            text: `Tutto ciò premesso, la sottoscritta ${ORGANIZATION.name} dà atto che il canone annuo convenuto dalle parti in ${data.details.partialAgreedAnnualRent > 0 ? formatMoney(data.details.partialAgreedAnnualRent) : "€ ……………"} è conforme all'${accord.agreementTitle} in quanto il ${formatNumber(partial.share * 100)}% del canone minimo annuale previsto dall'Accordo è pari a ${formatMoney(partial.annual.min)} ed il ${formatNumber(partial.share * 100)}% del canone massimo annuale previsto dall'Accordo è pari a ${formatMoney(partial.annual.max)}.`,
            alignment: "justify",
        },
        signatures(data.details.issueDate, "Il richiedente/dichiarante", ORGANIZATION.name),
    ];
}

function attestationPremise({ data, accord }: Pick<PdfInput, "data" | "accord">) {
    const { details, calculation } = data;
    const registration = details.registration.isPending
        ? "(in corso di registrazione, essendo i termini non ancora scaduti)"
        : `registrato il ${details.registration.date ? formatDate(details.registration.date) : "……………"} al n. ${filled(details.registration.number, "………………")} presso l'Agenzia delle Entrate ${filled(details.registration.office, "………………………")}`;

    return `il Sig. ${filled(details.landlord.name)} C.F.: ${filled(details.landlord.taxCode, "…………………")} residente in ${filled(details.landlord.residence)} nella qualità di locatore dell'immobile/porzione di immobile sito in ${filled(details.address)}, piano ${calculation.floor}, int. ${filled(details.unit, "……")}, in forza di contratto stipulato con il Sig. ${filled(details.tenant.name)} C.F.: ${filled(details.tenant.taxCode, "…………………")}, residente in ${filled(details.tenant.residence)} il ${formatDate(calculation.contractDate)} e decorrenza il ${details.leaseStartDate ? formatDate(details.leaseStartDate) : "……………"}${details.registration.isPending ? " " : ", "}${registration}`;
}

function prospectusContent(input: PdfInput): Content[] {
    const { accord, data, result } = input;
    const monthly = result.monthly!;

    return [
        header(input),
        {
            text: `PROSPETTO DI CALCOLO DEL CANONE DI LOCAZIONE IN BASE ALL'${accord.agreementTitle.toUpperCase()} ${accord.referenceText.toUpperCase()}`,
            style: "title",
            margin: [0, 8, 0, 8],
        },
        { text: propertyLine(input) },
        ...(data.details.landlord.name
            ? [{ text: `Locatore: ${data.details.landlord.name}`, margin: [0, 2, 0, 0] } as Content]
            : []),
        ...(accord.zones.length > 0
            ? [{ text: `MICROZONA ${data.calculation.zone}`, bold: true, margin: [0, 6, 0, 0] } as Content]
            : []),
        heading("SUPERFICIE CONVENZIONALE"),
        surfaceTable(input),
        heading("ELEMENTI OGGETTIVI DI CLASSIFICAZIONE"),
        classificationTable(input),
        classificationSummary(input),
        heading("ELEMENTI DI MAGGIORAZIONE / RIDUZIONE"),
        surchargesTable(input),
        heading("CANONE MENSILE stabilito dall'Accordo Territoriale:"),
        {
            text: `minimo ${formatMoney(monthly.min)} / massimo ${formatMoney(monthly.max)}`,
            bold: true,
            fontSize: 12,
        },
        { text: "I dati sopra riportati sono stati forniti dal locatore.", margin: [0, 10, 0, 0] },
        istatNote(input),
        signatures(data.details.issueDate, "", ORGANIZATION.name, input.signature),
        ...(result.partialLease ? partialLeasePage(input) : []),
    ];
}

/** "CANONE: € 7,58 mq/mese x 66 mq. = € 500,00 mensili = € 6.000,00 annuo", or the line to fill in by hand. */
function agreedRentLine({ data, result }: Pick<PdfInput, "data" | "result">) {
    const agreedAnnualRent = data.details.agreedAnnualRent;
    const totalSurface = result.surface!.total;
    return agreedAnnualRent > 0
        ? `CANONE: ${formatMoney(agreedAnnualRent / 12 / totalSurface)} mq/mese x ${formatNumber(totalSurface)} mq. = ${formatMoney(agreedAnnualRent / 12)} mensili = ${formatMoney(agreedAnnualRent)} annuo`
        : "CANONE: € …… mq/mese x …… mq. = € …… mensili = € …… annuo";
}

// --- Attestation of the Provincia: the short form of the association, with the calculation attached ---

const PROVINCE_AGREEMENT = "Accordo Territoriale per i Comuni della Provincia di Como";
const PROVINCE_DECREE = "D.M. 30.12.2002";

const LEASE_LAW: Record<LeaseType, { article: string; description: string }> = {
    agreed: { article: "art. 2, comma 3", description: "ad uso abitativo" },
    transitory: { article: "art. 5, comma 1", description: "ad uso abitativo transitorio" },
    student: { article: "art. 5, comma 2", description: "ad uso abitativo per studenti universitari" },
};

function provincePremise({ data }: Pick<PdfInput, "data">, leaseType: LeaseType) {
    const { details, calculation } = data;
    const law = LEASE_LAW[leaseType];
    const registration = details.registration.isPending
        ? "(in corso di registrazione, essendo i termini non ancora scaduti)"
        : `registrato il ${details.registration.date ? formatDate(details.registration.date) : "……………"} al n. ${filled(details.registration.number, "………………")} presso l'Ufficio Territoriale di ${filled(details.registration.office, "………………………")}`;
    const party = (person: DocumentData["details"]["landlord"], role: string) =>
        `il Sig. ${filled(person.name)} nato a ${filled(person.birthPlace, "………………")} il ${person.birthDate ? formatDate(person.birthDate) : "……………"} residente a ${filled(person.residence)} C.F. ${filled(person.taxCode, "…………………")} in qualità di ${role}`;

    return (
        `In riferimento al contratto di locazione ${law.description} stipulato ai sensi dell'${law.article}, L. 431/1998 ` +
        `con canone annuo di ${details.agreedAnnualRent > 0 ? formatMoney(details.agreedAnnualRent) : "€ ………………"}, ` +
        `stipulato in data ${formatDate(calculation.contractDate)} relativo all'immobile sito in ${filled(details.address)}, ` +
        `piano ${calculation.floor}${details.unit ? `, int. ${details.unit}` : ""} ` +
        `con decorrenza dal ${details.leaseStartDate ? formatDate(details.leaseStartDate) : "……………"} ${registration}, ` +
        `tra ${party(details.landlord, "locatore")} e ${party(details.tenant, "conduttore")}, ` +
        `l'${ORGANIZATION.shortName}, in persona del dipendente delegato ${ORGANIZATION.delegateSurnameFirst},`
    );
}

/** The calculation of the rent, attached to the attestation: the figures of a prospetto, plus the rent agreed. */
function provinceRentStatement(input: PdfInput): Content[] {
    const { data, result } = input;
    const perSquareMeter = result.ratePerSquareMeter!;
    const monthly = result.monthly!;

    return [
        { text: "PROSPETTO DI CONTEGGIO DEL CANONE", style: "title", pageBreak: "before", margin: [0, 0, 0, 8] },
        { text: propertyLine(input) },
        ...(data.details.landlord.name ? [{ text: `Locatore: ${data.details.landlord.name}`, margin: [0, 2, 0, 0] } as Content] : []),
        heading("SUPERFICIE CONVENZIONALE"),
        surfaceTable(input),
        heading("ELEMENTI OGGETTIVI DI CLASSIFICAZIONE"),
        classificationTable(input),
        classificationSummary(input),
        heading("ELEMENTI DI MAGGIORAZIONE / RIDUZIONE"),
        surchargesTable(input),
        heading("CANONE stabilito dall'Accordo Territoriale:"),
        { text: `al mq. mensile: minimo ${formatMoney(perSquareMeter.min)} / massimo ${formatMoney(perSquareMeter.max)}` },
        { text: `canone mensile: minimo ${formatMoney(monthly.min)} / massimo ${formatMoney(monthly.max)}`, bold: true, fontSize: 12, margin: [0, 2, 0, 0] },
        { text: agreedRentLine(input), bold: true, margin: [0, 8, 0, 0] },
        { text: "I dati sopra riportati sono stati forniti dal locatore.", margin: [0, 10, 0, 0] },
        signatures(data.details.issueDate, "", ORGANIZATION.name),
    ];
}

function provinceAttestationContent(input: PdfInput): Content[] {
    const { accord, data, result } = input;
    const leaseType = leaseTypeOf("attestation", accord.territory, data.details);
    const hasBoundRent = LEASE_TYPES[leaseType].hasBoundRent;
    // The date the accord was signed, written as in the attestations of the association: 02.09.2003.
    const agreementDate = formatDate(accord.validFrom).replaceAll("/", ".");

    return [
        header(input),
        { text: "ATTESTAZIONE DI RISPONDENZA", style: "title", margin: [0, 10, 0, 2] },
        { text: "COMUNI DELLA PROVINCIA DI COMO", style: "title", margin: [0, 0, 0, 2] },
        { text: LEASE_TYPES[leaseType].heading, style: "title", margin: [0, 0, 0, 14] },
        { text: provincePremise(input, leaseType), alignment: "justify", fontSize: 10, lineHeight: 1.3 },
        { text: "ATTESTA", style: "heading", alignment: "center", margin: [0, 12, 0, 8] },
        {
            text:
                `che i contenuti ${hasBoundRent ? "economici e normativi" : "normativi"} del contratto sopra descritto corrispondono a quanto previsto ` +
                `dal vigente ${PROVINCE_AGREEMENT} stipulato in data ${agreementDate} in forza del ${PROVINCE_DECREE}.` +
                (hasBoundRent ? "" : " Tale Accordo Territoriale prevede che le parti possano determinare liberamente la misura del canone di locazione."),
            alignment: "justify",
            fontSize: 10,
            lineHeight: 1.3,
        },
        ...(hasBoundRent
            ? [{ text: "Si allega alla presente il prospetto di conteggio del canone.", margin: [0, 10, 0, 0], fontSize: 10 } as Content]
            : []),
        signatures(data.details.issueDate, "", ORGANIZATION.name),
        ...(hasBoundRent && result.surface ? provinceRentStatement(input) : []),
        ...(hasBoundRent && result.partialLease ? partialLeasePage(input) : []),
    ];
}

function attestationContent(input: PdfInput): Content[] {
    if (input.accord.territory === "province") return provinceAttestationContent(input);

    const { accord, data, result } = input;
    const perSquareMeter = result.ratePerSquareMeter!;
    const monthly = result.monthly!;

    const rentLine = agreedRentLine(input);

    return [
        {
            columns: [
                { image: input.logo, width: 120 },
                {
                    stack: [
                        { text: numberLabel(input.documentNumber), alignment: "right" },
                        { text: `Contratto stipulato il: ${formatDate(data.calculation.contractDate)}`, alignment: "right", margin: [0, 4, 0, 0] },
                    ],
                    margin: [0, 8, 0, 0],
                },
            ],
        },
        { text: "ATTESTAZIONE DI RISPONDENZA EX D.M. 16/1/2017", style: "title", margin: [0, 8, 0, 8] },
        {
            text: `L'${ORGANIZATION.name}, firmataria dell'${accord.agreementTitle} ${accord.referenceText}, in persona del dipendente delegato ${ORGANIZATION.delegate},`,
            alignment: "justify",
        },
        { text: "PREMESSO CHE", style: "heading", margin: [0, 8, 0, 4] },
        { text: attestationPremise(input), alignment: "justify" },
        { text: "CHIEDE", style: "heading", margin: [0, 8, 0, 4] },
        { text: "l'attestazione ex D.M. 16/1/2017, sulla base dei dati di seguito indicati:" },
        heading("CALCOLO DELLA SUPERFICIE ai sensi dell'art. 2 dell'Accordo Territoriale"),
        surfaceTable(input),
        heading("ELEMENTI OGGETTIVI DI CLASSIFICAZIONE"),
        classificationTable(input),
        {
            text: [
                ...(accord.zones.length > 0 ? [{ text: `MICROZONA ${data.calculation.zone}`, bold: true }, { text: "    " }] : []),
                { text: `UNITÀ ABITATIVA SITA AL PIANO ${data.calculation.floor}`, bold: true },
            ],
            margin: [0, 6, 0, 0],
        },
        classificationSummary(input),
        {
            text: `CANONE MENSILE stabilito dall'Accordo Territoriale al mq.: minimo ${formatMoney(perSquareMeter.min)} massimo ${formatMoney(perSquareMeter.max)}`,
            margin: [0, 8, 0, 4],
        },
        surchargesTable(input),
        { text: rentLine, bold: true, margin: [0, 8, 0, 0] },
        { text: `Canone mensile consentito: ${formatMoney(monthly.min)} - ${formatMoney(monthly.max)}`, fontSize: 8.5, color: "#666666" },
        istatNote(input),
        { text: "DICHIARA", style: "heading", margin: [0, 10, 0, 4] },
        {
            ol: [
                "Che i dati sovresposti sono stati dallo stesso rilevati e verificati;",
                "Di essere consapevole che la presente Attestazione viene rilasciata sulla base di tali dati;",
                "Di sollevare espressamente l'Organizzazione attestante da qualsivoglia responsabilità eventualmente derivante da errori, omissioni o indicazioni non veritiere in relazione a tali dati.",
            ],
            type: "decimal",
        },
        {
            text: `Tutto ciò premesso, l'${ORGANIZATION.name}, come sopra rappresentata, sulla base degli elementi oggettivi sopra dichiarati, anche ai fini dell'ottenimento di eventuali agevolazioni fiscali,`,
            margin: [0, 10, 0, 4],
            alignment: "justify",
        },
        { text: "ATTESTA", style: "heading", margin: [0, 4, 0, 4] },
        {
            text: `che i contenuti economici e normativi del contratto sopra descritto corrispondono a quanto previsto dall'${accord.agreementTitle} vigente, ${accord.referenceText}.`,
            alignment: "justify",
        },
        {
            text: "Il Locatore conferma di aver letto l'informativa di cui all'art. 13 Reg. UE 679/2016 (Regolamento Generale sulla Protezione dei Dati) circa il trattamento e la conservazione dei dati forniti a Confedilizia-Como per il rilascio della presente Attestazione di Rispondenza.",
            fontSize: 8.5,
            margin: [0, 10, 0, 0],
            alignment: "justify",
        },
        signatures(data.details.issueDate, "Il richiedente/dichiarante", ORGANIZATION.name),
        ...(result.partialLease ? partialLeasePage(input) : []),
    ];
}

export function buildDocumentPdf(input: PdfInput): TDocumentDefinitions {
    return {
        pageSize: "A4",
        pageMargins: [40, 28, 40, 28],
        defaultStyle: { fontSize: 9, lineHeight: 1.1 },
        styles: {
            title: { fontSize: 12, bold: true, alignment: "center" },
            heading: { fontSize: 9.5, bold: true },
        },
        info: {
            title: input.kind === "prospectus" ? "Prospetto di calcolo" : "Attestazione di rispondenza",
            author: ORGANIZATION.name,
        },
        content: input.kind === "prospectus" ? prospectusContent(input) : attestationContent(input),
    };
}

export function pdfFileName({ kind, data, documentNumber }: Pick<PdfInput, "kind" | "data" | "documentNumber">) {
    const base = kind === "prospectus" ? "prospetto" : "attestazione";
    const slug = (data.details.landlord.name || data.details.address || data.calculation.contractDate)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40);
    return `${base}${documentNumber ? `-${documentNumber}` : ""}-${slug || "documento"}.pdf`;
}
