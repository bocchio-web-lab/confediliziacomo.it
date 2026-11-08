// Turns the JSON made by `extract_excel.py` into an SQL file to review, plus a report that compares what the
// application calculates with what the Excel files of the association say.
// Nothing is written to the database: the SQL is applied by hand (see scripts/import/README.md).
//
// Usage: node scripts/import/generate-sql.ts <extracted.json> <output folder> --importer <email of a user>
//
// Output folder:
//   import.sql      one transaction: the documents, the counters of the numbers and one audit row
//   report.csv      one line per Excel file: what was found and whether the numbers agree
//   report.md       the summary, with every file that needs a look
//   manifest.json   what the SQL inserts, for `verify-import.ts` to compare with the database afterwards
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { calculate, findIstatIndex } from "#lib/accords/calculate.ts";
import { resolveAccord } from "#lib/accords/registry.ts";
import type { CalculationResult, Fascia, IstatIndex } from "#lib/accords/types.ts";
import { FASCIA_ORDER } from "#lib/accords/calculate.ts";
import { sequenceKey } from "#lib/documents/numbering.ts";
import { buildSearchText } from "#lib/documents/search.ts";
import { dateNameOf, sanitizeDocumentData, type DocumentData } from "#lib/documents/types.ts";

// --- What the extractor writes -------------------------------------------------------------------------------------

interface Extracted {
    recognised: boolean;
    file: string;
    folderYear: number;
    hasPdf: boolean;
    fileNumber: number | null;
    sheetNumber: number | null;
    client: string;
    addressFromFileName: string;
    address: { raw: string | null; address: string; unit: string };
    date: string | null;
    zone: number | null;
    floor: number | null;
    surfaces: Record<string, number>;
    parameters: number[];
    noIndoorBathroom: boolean;
    surcharges: Record<string, boolean | string>;
    partialLease: { tenantSurface: number; otherTenantsSurface: number } | null;
    excel: {
        minMonthly: number | null;
        maxMonthly: number | null;
        fascia: Fascia | null;
        totalSurface: number | null;
        surchargeSum: number | null;
        istatTable: Record<string, number>;
        partial: { minMonthly: number; maxMonthly: number } | null;
    };
    warnings: string[];
}

// --- Numbering -----------------------------------------------------------------------------------------------------

// The numbers the association gave to its files are not used (they started again every year, and some are
// repeated): the documents are numbered again, in order of date, in the sequence of the application
// (src/lib/documents/numbering.ts), so that the ones created from now on continue from the last one.
// The old number is kept in the report and in the audit log, to find the original file.
const SEQUENCE_KEY = sequenceKey("prospectus", "city");

// --- Helpers -------------------------------------------------------------------------------------------------------

const { values: options, positionals } = parseArgs({
    allowPositionals: true,
    options: { importer: { type: "string" } },
});
const [inputPath, outputFolder] = positionals;
if (!inputPath || !outputFolder || !options.importer) {
    console.error("Usage: node scripts/import/generate-sql.ts <extracted.json> <output folder> --importer <email>");
    process.exit(1);
}

// The SQL file is pure ASCII: whoever runs it (a terminal, an editor, psql on Windows) may read it with a wrong
// encoding, and accents would be saved as "Ã " and the like. Special characters are written as escapes instead.
const hex = (character: string) => character.codePointAt(0)!.toString(16).padStart(6, "0");
const quote = (value: string) =>
    /^[\x20-\x7e]*$/.test(value)
        ? `'${value.replaceAll("'", "''")}'`
        : `U&'${value
              .replaceAll("\\", "\\\\")
              .replaceAll("'", "''")
              .replace(/[^\x20-\x7e]/gu, (character) => `\\+${hex(character)}`)}'`;
const jsonLiteral = (value: unknown) => {
    // Without the `u` flag the pattern sees UTF-16 units, which is what a JSON \u escape is.
    const text = JSON.stringify(value).replace(
        /[^\x20-\x7e]/g,
        (unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, "0")}`,
    );
    if (text.includes("$import$")) throw new Error("Unexpected text in the data.");
    return `$import$${text}$import$::jsonb`;
};
/** A file name in an SQL comment: the same, without the characters outside ASCII. */
const commentText = (value: string) => value.replace(/[^\x20-\x7e]/gu, "?");
const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const euro = (value: number | null | undefined) => (typeof value === "number" ? value.toFixed(2) : "");
const SMALL = 0.011; // Excel does not round: a cent of difference is not a difference

async function loadIstatIndices(): Promise<IstatIndex[]> {
    const migration = await readFile(join(import.meta.dirname, "..", "..", "db", "migrations", "002_istat_indices.sql"), "utf8");
    const indices = [...migration.matchAll(/\('(\d{4}-\d{2}-\d{2})',\s*([\d.]+)\)/g)].map((match) => ({
        validFrom: match[1],
        coefficient: Number(match[2]),
    }));
    // The accord is in force from 6 October 2020 and the table starts on 1 November: until then there was no
    // revaluation, which is a coefficient of 1.
    return [{ validFrom: "2020-10-06", coefficient: 1 }, ...indices];
}

const excelCoefficient = (table: Record<string, number>, date: string) =>
    findIstatIndex(
        Object.entries(table).map(([validFrom, coefficient]) => ({ validFrom, coefficient })),
        date,
    )?.coefficient ?? 1;

// --- One document --------------------------------------------------------------------------------------------------

interface Prepared {
    record: Extracted;
    /** The new number: given once all the documents are known and sorted. */
    number: number;
    /** The number the association gave to the file (the one inside the sheet, else the one in the file name). */
    legacyNumber: number | null;
    title: string;
    data: DocumentData;
    result: CalculationResult;
    notes: string[];
    differences: string[];
}

function prepare(record: Extracted, databaseIndices: IstatIndex[]): Prepared | { record: Extracted; skipped: string } {
    if (!record.date) return { record, skipped: "data mancante" };
    const accord = resolveAccord("city", record.date);
    if (!accord) return { record, skipped: "nessun accordo in vigore alla data" };

    const notes = [...record.warnings];

    // The coefficients the association used are the ones in its own file, when it has them: the table of the
    // application may have been corrected since (and that must not change a document issued long ago).
    const fileIndices = Object.entries(record.excel.istatTable).map(([validFrom, coefficient]) => ({ validFrom, coefficient }));
    const istatIndices = fileIndices.length > 0 ? fileIndices : databaseIndices;
    if (fileIndices.length > 0) {
        const inFile = findIstatIndex(fileIndices, record.date)?.coefficient;
        const inDatabase = findIstatIndex(databaseIndices, record.date)?.coefficient;
        if (inFile !== inDatabase) {
            notes.push(`Indice ISTAT del file (${inFile}) diverso da quello attuale della tabella (${inDatabase}): usato quello del file.`);
        }
    }

    // The address line of the sheet has dots or ellipses where something was left blank; when it is mostly the
    // template ("Via/P.za ...... n. ...") the one in the file name is better.
    const cleaned = record.address.address.replace(/…+|\.{3,}/g, "").replace(/\s+/g, " ").replace(/[\s,.]+$/, "");
    const isTemplate = /via\/p\.za/i.test(cleaned) || (record.address.address.match(/…/g) ?? []).length > 3;
    const address = cleaned && !isTemplate ? cleaned : record.addressFromFileName;
    if (isTemplate) notes.push(`Indirizzo del foglio non compilato: usato quello del nome del file («${address}»).`);
    const raw = {
        calculation: {
            contractDate: record.date,
            zone: record.zone,
            floor: record.floor,
            surfaces: record.surfaces,
            parameters: record.parameters,
            noIndoorBathroom: record.noIndoorBathroom,
            fasciaOverride: null,
            surcharges: record.surcharges,
            partialLease: record.partialLease,
        },
        details: {
            address,
            unit: record.address.unit,
            issueDate: record.date,
            landlord: { name: record.client },
            showSignature: true,
        },
        requestedNumber: null, // set with the new number
    };

    let data = sanitizeDocumentData(raw, accord);
    let result = calculate(accord, data.calculation, istatIndices, dateNameOf("prospectus"));
    const differences: string[] = [];

    // Excel lets whoever fills the file overwrite the fascia: when it is lower than the automatic one, keep it.
    const excelFascia = record.excel.fascia;
    const automatic = result.classification?.automaticFascia;
    if (excelFascia && automatic && excelFascia !== automatic) {
        if (FASCIA_ORDER.indexOf(excelFascia) < FASCIA_ORDER.indexOf(automatic)) {
            data = { ...data, calculation: { ...data.calculation, fasciaOverride: excelFascia } };
            result = calculate(accord, data.calculation, istatIndices, dateNameOf("prospectus"));
            notes.push(`Fascia dell'Excel (${excelFascia}) più bassa di quella automatica (${automatic}): impostata come fascia scelta.`);
        } else {
            differences.push(`fascia: Excel ${excelFascia}, applicazione ${automatic} (l'applicazione non può alzarla)`);
        }
    }

    // Past documents were made when later ISTAT rows did not exist yet: the "index not entered" warning is not true.
    if (result.istat?.isOutdated && istatIndices.some((index) => index.validFrom > record.date!)) {
        result.istat.isOutdated = false;
        result.warnings = result.warnings.filter((warning) => !warning.includes("ISTAT"));
    }

    // --- Compare with what Excel calculated ---
    const { excel } = record;
    if (result.issues.length > 0) differences.push(`calcolo non riuscito: ${result.issues.join(" ")}`);
    if (excel.totalSurface !== null && result.surface && Math.abs(result.surface.total - excel.totalSurface) > 0.005) {
        differences.push(`superficie convenzionale: Excel ${excel.totalSurface}, applicazione ${result.surface.total}`);
    }
    if (excel.surchargeSum !== null && Math.abs(result.totalSurchargePercent / 100 - excel.surchargeSum) > 0.0005) {
        differences.push(`maggiorazioni: Excel ${excel.surchargeSum * 100}%, applicazione ${result.totalSurchargePercent}%`);
    }
    if (result.monthly && excel.minMonthly !== null && excel.maxMonthly !== null) {
        const minimumDiffers = Math.abs(result.monthly.min - excel.minMonthly) > SMALL;
        const maximumDiffers = Math.abs(result.monthly.max - excel.maxMonthly) > SMALL;
        if (minimumDiffers || maximumDiffers) {
            const databaseCoefficient = result.istat?.coefficient ?? 1;
            const fileCoefficient = excelCoefficient(excel.istatTable, record.date);
            const explainedByIstat =
                Math.abs(result.monthly.min / excel.minMonthly - databaseCoefficient / fileCoefficient) < 0.002;
            differences.push(
                `canone mensile: Excel ${euro(excel.minMonthly)}–${euro(excel.maxMonthly)}, applicazione ${euro(result.monthly.min)}–${euro(result.monthly.max)}` +
                    (explainedByIstat
                        ? ` (dovuto all'indice ISTAT: ${fileCoefficient} nel file, ${databaseCoefficient} nell'applicazione)`
                        : ""),
            );
        }
    } else if (result.monthly) {
        notes.push("Canone dell'Excel non letto: confronto non possibile.");
    }
    if (result.partialLease && excel.partial) {
        const { monthly } = result.partialLease;
        if (Math.abs(monthly.min - excel.partial.minMonthly) > SMALL || Math.abs(monthly.max - excel.partial.maxMonthly) > SMALL) {
            differences.push(
                `locazione parziale: Excel ${euro(excel.partial.minMonthly)}–${euro(excel.partial.maxMonthly)}, applicazione ${euro(monthly.min)}–${euro(monthly.max)}`,
            );
        }
    } else if (record.partialLease) {
        notes.push("Locazione parziale: canone dell'Excel non letto, confronto non possibile.");
    }

    // The name and the address come from the name of the file (the sheet has no name): odd ones need a look.
    if (/[\d_]/.test(record.client) || record.client.length > 35 || !record.client) {
        notes.push(`Nome ricavato dal nome del file e dall'aspetto strano: «${record.client}». Controllarlo.`);
    }

    const title = data.details.landlord.name || data.details.address || "Senza nome né indirizzo";
    const legacyNumber = record.sheetNumber ?? record.fileNumber;
    return { record, number: 0, legacyNumber, title, data, result, notes, differences };
}

// --- Main ----------------------------------------------------------------------------------------------------------

const records = JSON.parse(await readFile(inputPath, "utf8")) as Extracted[];
const istatIndices = await loadIstatIndices();

const prepared: Prepared[] = [];
const skipped: { record: Extracted; reason: string }[] = [];
for (const record of [...records].sort((a, b) => a.file.localeCompare(b.file))) {
    if (!record.recognised) {
        skipped.push({ record, reason: "struttura del file non riconosciuta" });
        continue;
    }
    const outcome = prepare(record, istatIndices);
    if ("skipped" in outcome) skipped.push({ record, reason: outcome.skipped });
    else prepared.push(outcome);
}

// New numbers: oldest first. Documents of the same day follow the association's own order, then the file name.
prepared.sort(
    (a, b) =>
        a.record.date!.localeCompare(b.record.date!) ||
        (a.legacyNumber ?? 0) - (b.legacyNumber ?? 0) ||
        a.record.file.localeCompare(b.record.file),
);
prepared.forEach((item, index) => {
    item.number = index + 1;
    item.data.requestedNumber = item.number;
});

// Within a day the creation time goes up with the number, so that the lists show them in the same order.
const secondsInDay = new Map<string, number>();
const createdAtOf = new Map<Prepared, string>();
for (const item of prepared) {
    const seconds = secondsInDay.get(item.record.date!) ?? 0;
    secondsInDay.set(item.record.date!, seconds + 1);
    const clock = `12:${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    createdAtOf.set(item, `(${quote(`${item.record.date} ${clock}`)}::timestamp at time zone 'Europe/Rome')`);
}

// --- import.sql ----------------------------------------------------------------------------------------------------

const importer = quote(options.importer);
const lines: string[] = [
    "-- Historical prospetti of the Comune di Como, imported from the Excel files of the association.",
    `-- Generated ${new Date().toISOString()} by scripts/import/generate-sql.ts: ${prepared.length} documents.`,
    "-- One transaction: either every document is inserted or none. Review it, then run it in the SQL editor.",
    "",
    "begin;",
    "",
    "create temporary table import_user on commit drop as",
    `    select id from users where email = ${importer};`,
    "do $$",
    "begin",
    `    if not exists (select 1 from import_user) then raise exception 'No user with email %', ${importer}; end if;`,
    "end $$;",
    "",
    "-- Prospetti of the Comune already in the database (made in the application before this import) go after the",
    "-- imported ones: they keep their order and take the next numbers of the same sequence. Nothing happens if there",
    "-- are none. The other sequences (Provincia, attestazioni) are not touched.",
    "create temporary table renumbered on commit drop as",
    "    select id, sequence_key as old_sequence_key, document_number as old_number,",
    `        ${prepared.length} + row_number() over (order by created_at, document_number, id) as new_number`,
    `    from documents where sequence_key = ${quote(SEQUENCE_KEY)};`,
    "",
    "update documents d",
    "set document_number = r.new_number,",
    "    -- the search text ends with the number",
    "    search_text = regexp_replace(d.search_text, '(^|\\s)' || d.document_number || '$', '\\1' || r.new_number),",
    "    input = case when jsonb_typeof(d.input -> 'requestedNumber') = 'number'",
    "        then jsonb_set(d.input, '{requestedNumber}', to_jsonb(r.new_number)) else d.input end",
    "from renumbered r where d.id = r.id;",
    "",
    "insert into audit_log (user_id, user_label, action, entity_type, details)",
    `select id, ${importer}, 'documents.renumber', 'prospectus', jsonb_build_object('documents', (`,
    "    select jsonb_agg(jsonb_build_object('id', r.id, 'oldSequence', r.old_sequence_key, 'oldNumber', r.old_number,",
    "        'newNumber', r.new_number) order by r.new_number) from renumbered r))",
    "from import_user where exists (select 1 from renumbered);",
    "",
];

for (const item of prepared) {
    const { data, result, record } = item;
    // Imported documents carry the date of the document as creation date, so the lists show them in order.
    const createdAt = createdAtOf.get(item)!;
    lines.push(
        `-- n. ${item.number}: ${commentText(record.file)}`,
        "insert into documents (kind, territory, accord_id, sequence_key, document_number, contract_date, title,",
        "    applicant_name, address, search_text, input, result, created_by, created_at, updated_by, updated_at)",
        "values (" +
            [
                "'prospectus'",
                "'city'",
                quote(result.accordId),
                quote(SEQUENCE_KEY),
                item.number,
                quote(record.date!),
                quote(item.title),
                quote(data.details.landlord.name),
                quote(data.details.address),
                quote(buildSearchText(data, item.number)),
                jsonLiteral(data),
                jsonLiteral(result),
                "(select id from import_user)",
                createdAt,
                "(select id from import_user)",
                createdAt,
            ].join(", ") +
            ");",
        "",
    );
}

lines.push(
    "-- Last number of the sequence, so that the application continues from it.",
    "insert into document_counters (sequence_key, last_number)",
    `    values (${quote(SEQUENCE_KEY)}, ${prepared.length} + (select count(*) from renumbered))`,
    "    on conflict (sequence_key) do update set last_number = greatest(document_counters.last_number, excluded.last_number);",
    "",
    "-- The audit row keeps where each document comes from: its new number, the old one and the Excel file.",
    "insert into audit_log (user_id, user_label, action, entity_type, details)",
    `select id, ${importer}, 'documents.import', 'prospectus', ${jsonLiteral({
        count: prepared.length,
        source: "excel",
        documents: prepared.map((item) => ({ number: item.number, legacyNumber: item.legacyNumber, file: item.record.file })),
    })} from import_user;`,
    "",
    "commit;",
    "",
);

// --- Reports -------------------------------------------------------------------------------------------------------

const withDifferences = prepared.filter((item) => item.differences.length > 0);
const statusOf = (item: Prepared) => (item.differences.length > 0 ? "DA CONTROLLARE" : item.notes.length > 0 ? "OK (note)" : "OK");

const csv = [
    ["file", "numero originale", "nuovo numero", "data", "nome", "indirizzo", "microzona", "piano", "mq convenzionali", "fascia", "canone min Excel", "canone max Excel", "canone min app", "canone max app", "PDF", "stato", "differenze", "note"],
    ...prepared.map((item) => [
        item.record.file,
        item.legacyNumber,
        item.number,
        item.record.date,
        item.title,
        item.data.details.address,
        item.record.zone,
        item.record.floor,
        item.result.surface?.total.toFixed(3),
        item.result.classification?.fascia,
        euro(item.record.excel.minMonthly),
        euro(item.record.excel.maxMonthly),
        euro(item.result.monthly?.min),
        euro(item.result.monthly?.max),
        item.record.hasPdf ? "sì" : "no",
        statusOf(item),
        item.differences.join(" | "),
        item.notes.join(" | "),
    ]),
    ...skipped.map(({ record, reason }) => [record.file, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "NON IMPORTATO", reason, ""]),
]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

const perYear = new Map<string, number>();
for (const item of prepared) {
    const year = item.record.date!.slice(0, 4);
    perYear.set(year, (perYear.get(year) ?? 0) + 1);
}
const firstNumberOfYear = (year: string) => prepared.find((item) => item.record.date!.startsWith(year))!.number;
const lastNumberOfYear = (year: string) => prepared.findLast((item) => item.record.date!.startsWith(year))!.number;

const section = (title: string, items: string[]) => (items.length ? [`## ${title} (${items.length})`, "", ...items.map((item) => `- ${item}`), ""] : []);
const report = [
    "# Importazione dei prospetti storici",
    "",
    `- File Excel letti: ${records.length}`,
    `- Documenti da importare: ${prepared.length}`,
    `- Non importati: ${skipped.length}`,
    `- Importati senza differenze rispetto all'Excel: ${prepared.length - withDifferences.length}`,
    `- Importati ma da controllare: ${withDifferences.length}`,
    `- Senza PDF: ${prepared.filter((item) => !item.record.hasPdf).length}`,
    "",
    "## Nuovi numeri (progressivi, in ordine di data; la corrispondenza con i vecchi è in report.csv)",
    "",
    ...[...perYear].sort().map(([year, count]) => `- ${year}: ${count} documenti, dal n. ${firstNumberOfYear(year)} al n. ${lastNumberOfYear(year)}`),
    "",
    ...section("Non importati", skipped.map(({ record, reason }) => `${record.file}: ${reason}`)),
    ...section("Da controllare (le cifre dell'applicazione non coincidono con l'Excel)", withDifferences.map((item) => `${item.record.file}: ${item.differences.join("; ")}`)),
    ...section(
        "Note",
        prepared.filter((item) => item.notes.length > 0).map((item) => `${item.record.file}: ${item.notes.join("; ")}`),
    ),
].join("\n");

await mkdir(outputFolder, { recursive: true });
await writeFile(join(outputFolder, "import.sql"), lines.join("\n"), "utf8");
await writeFile(join(outputFolder, "report.csv"), `﻿${csv}\n`, "utf8");
await writeFile(join(outputFolder, "report.md"), `${report}\n`, "utf8");
await writeFile(
    join(outputFolder, "manifest.json"),
    JSON.stringify(
        prepared.map((item) => ({
            file: item.record.file,
            sequenceKey: SEQUENCE_KEY,
            documentNumber: item.number,
            contractDate: item.record.date,
            input: item.data,
            result: item.result,
        })),
        null,
        1,
    ),
    "utf8",
);

console.log(report.split("\n").slice(0, 12).join("\n"));
console.log(`\nWritten to ${outputFolder}`);
