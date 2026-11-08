// Checks that the database holds exactly what `generate-sql.ts` meant to insert: every document of the manifest is
// there, with the same date, text, input and result, and the counters are at the right number.
// It only reads. Run it after applying import.sql.
//
// Usage: npm run import:verify -- <manifest.json>        (the database is the one of DATABASE_URL, see .env)
import { readFile } from "node:fs/promises";
import postgres from "postgres";

interface ManifestItem {
    file: string;
    sequenceKey: string;
    documentNumber: number;
    contractDate: string;
    input: { details: { landlord: { name: string }; address: string } };
    result: unknown;
}

const [manifestPath] = process.argv.slice(2);
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!manifestPath || !connectionString) {
    console.error("Usage: npm run import:verify -- <manifest.json>   (with DATABASE_URL set)");
    process.exit(1);
}

/** JSON text with the keys in order: jsonb does not keep the order the keys were written in. */
const canonical = (value: unknown): string =>
    JSON.stringify(value, (_, inner) =>
        inner && typeof inner === "object" && !Array.isArray(inner)
            ? Object.fromEntries(Object.entries(inner).sort(([a], [b]) => a.localeCompare(b)))
            : inner,
    );

const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as ManifestItem[];
const sql = postgres(connectionString, { max: 1, onnotice: () => {} });

try {
    const problems: string[] = [];
    const keys = [...new Set(manifest.map((item) => item.sequenceKey))];

    const rows = await sql<
        {
            sequenceKey: string;
            documentNumber: number;
            contractDate: string;
            applicantName: string;
            address: string;
            input: unknown;
            result: unknown;
            deletedAt: string | null;
        }[]
    >`
        select sequence_key as "sequenceKey", document_number as "documentNumber", contract_date::text as "contractDate",
               applicant_name as "applicantName", address, input, result, deleted_at::text as "deletedAt"
        from documents where sequence_key in ${sql(keys)}
    `;
    const stored = new Map(rows.map((row) => [`${row.sequenceKey}#${row.documentNumber}`, row]));

    for (const item of manifest) {
        const row = stored.get(`${item.sequenceKey}#${item.documentNumber}`);
        const label = `${item.file} (${item.sequenceKey} n. ${item.documentNumber})`;
        if (!row) {
            problems.push(`${label}: not in the database`);
            continue;
        }
        stored.delete(`${item.sequenceKey}#${item.documentNumber}`);
        if (row.deletedAt) problems.push(`${label}: deleted`);
        if (row.contractDate !== item.contractDate) problems.push(`${label}: date ${row.contractDate}, expected ${item.contractDate}`);
        if (row.applicantName !== item.input.details.landlord.name) problems.push(`${label}: name differs`);
        if (row.address !== item.input.details.address) problems.push(`${label}: address differs`);
        if (canonical(row.input) !== canonical(item.input)) problems.push(`${label}: input differs`);
        if (canonical(row.result) !== canonical(item.result)) problems.push(`${label}: result differs`);
    }
    // Documents made in the application are not part of the import: they must come after the imported ones.
    const lastImported = Math.max(...manifest.map((item) => item.documentNumber));
    const others = [...stored.values()].sort((a, b) => a.documentNumber - b.documentNumber);
    for (const row of others) {
        if (row.documentNumber <= lastImported) {
            problems.push(`${row.sequenceKey} n. ${row.documentNumber}: in the database but not in the manifest, and inside the imported numbers`);
        }
    }
    if (others.length > 0) {
        console.log(
            `${others.length} other documents, made in the application: n. ${others.map((row) => row.documentNumber).join(", ")}.`,
        );
    }

    const counters = await sql<{ sequenceKey: string; lastNumber: number }[]>`
        select sequence_key as "sequenceKey", last_number as "lastNumber" from document_counters where sequence_key in ${sql(keys)}
    `;
    for (const key of keys) {
        const expected = Math.max(...manifest.filter((item) => item.sequenceKey === key).map((item) => item.documentNumber));
        const actual = counters.find((counter) => counter.sequenceKey === key)?.lastNumber;
        if (actual === undefined || actual < expected) problems.push(`counter ${key}: ${actual ?? "missing"}, expected at least ${expected}`);
    }

    console.log(`${manifest.length} documents expected, ${rows.length} found in ${keys.length} sequences.`);
    if (problems.length === 0) {
        console.log("Everything matches.");
    } else {
        console.log(`${problems.length} problems:`);
        for (const problem of problems.slice(0, 50)) console.log(`  - ${problem}`);
        process.exitCode = 1;
    }
} finally {
    await sql.end();
}
