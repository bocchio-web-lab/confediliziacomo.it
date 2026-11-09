// Numbers the documents again, year by year: every combination of kind, territory and year of creation gets its own
// sequence that starts from 1 (see src/lib/documents/numbering.ts). It is meant for the documents made before the
// numbering was yearly, whose `sequence_key` has no year ("prospectus:city"); it moves them to "prospectus:city:2026"
// and so on, in order of creation. Documents that already have a yearly key are left alone, so it can be run again
// (a document that finds a yearly sequence already started goes after the last number of it).
//
// Every document is renumbered, also the deleted ones: a number is never reused. The search text, the counters and the
// number remembered in the saved data follow, and one row of the audit log keeps the old and the new numbers.
// The numbers printed on PDFs made before are not the new ones: use `--dry-run` to see them all first.
//
// Usage: npm run db:renumber -- --dry-run          shows what would change, changes nothing
//        npm run db:renumber                       asks to type the name of the database before doing it
//        npm run db:renumber -- --confirm <database name>     without the question
//
// It acts on DATABASE_URL_UNPOOLED (or DATABASE_URL): the host is printed first. To act on the production database
// set that variable for the single command (the real environment wins over .env).
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import postgres from "postgres";
import type { Territory } from "#lib/accords/types.ts";
import type { DocumentKind } from "#lib/documents/types.ts";
import { sequenceKey } from "#lib/documents/numbering.ts";

const { values } = parseArgs({ options: { "dry-run": { type: "boolean" }, confirm: { type: "string" } } });

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set.");
    process.exit(1);
}

const { host, pathname } = new URL(connectionString);
const databaseName = decodeURIComponent(pathname.slice(1));
const sql = postgres(connectionString, { max: 1, connect_timeout: 60, onnotice: () => {} });

interface LegacyDocument {
    id: string;
    kind: DocumentKind;
    territory: Territory;
    sequenceKey: string;
    documentNumber: number;
    searchText: string;
    /** Year of the creation, by the Italian calendar. */
    year: number;
    title: string;
}

interface Renumbered extends LegacyDocument {
    newKey: string;
    newNumber: number;
    newSearchText: string;
}

/** The search text ends with the number of the document: it follows the new one. */
const withNumber = (searchText: string, oldNumber: number, newNumber: number) =>
    searchText.replace(new RegExp(`(^|\\s)${oldNumber}$`), `$1${newNumber}`);

try {
    console.log(`Database: ${host}/${databaseName}`);

    const documents = await sql<LegacyDocument[]>`
        select id, kind, territory, sequence_key as "sequenceKey", document_number as "documentNumber",
               search_text as "searchText", title,
               extract(year from created_at at time zone 'Europe/Rome')::int as year
        from documents
        where sequence_key !~ ':[0-9]{4}$'
        order by kind, territory, created_at, document_number, id
    `;
    if (documents.length === 0) {
        console.log("Every document already has a yearly sequence: nothing to do.");
        process.exit(0);
    }

    // A yearly sequence that is already started (documents made with the new numbering) is continued, not overwritten.
    const keys = [...new Set(documents.map((document) => sequenceKey(document.kind, document.territory, document.year)))];
    const started = await sql<{ key: string; last: number }[]>`
        select key, max(last) as last from (
            select sequence_key as key, last_number as last from document_counters where sequence_key in ${sql(keys)}
            union all
            select sequence_key, max(document_number) from documents where sequence_key in ${sql(keys)} group by sequence_key
        ) found group by key
    `;
    const lastNumber = new Map(keys.map((key) => [key, started.find((row) => row.key === key)?.last ?? 0]));

    const renumbered: Renumbered[] = [];
    let missingSearchNumber = 0;
    for (const document of documents) {
        const newKey = sequenceKey(document.kind, document.territory, document.year);
        const newNumber = lastNumber.get(newKey)! + 1;
        lastNumber.set(newKey, newNumber);
        const newSearchText = withNumber(document.searchText, document.documentNumber, newNumber);
        if (newSearchText === document.searchText && document.documentNumber !== newNumber) missingSearchNumber++;
        renumbered.push({ ...document, newKey, newNumber, newSearchText });
    }

    console.log(`\n${documents.length} documents to renumber:`);
    for (const key of keys.sort()) {
        const group = renumbered.filter((document) => document.newKey === key);
        const old = group.map((document) => document.documentNumber);
        console.log(
            `  ${key.padEnd(28)} ${String(group.length).padStart(4)} documents  n. ${group[0].newNumber}-${group.at(-1)!.newNumber}` +
                `  (now n. ${Math.min(...old)}-${Math.max(...old)} of ${group[0].sequenceKey})`,
        );
    }
    if (missingSearchNumber > 0) console.log(`  (${missingSearchNumber} search texts did not end with the old number: left as they are)`);

    if (values["dry-run"]) {
        console.log("\nDry run: nothing was changed.");
        process.exit(0);
    }

    const answer =
        values.confirm ??
        (await createInterface({ input: process.stdin, output: process.stdout }).question(
            `\nThis changes the numbers of ${documents.length} documents. Type the name of the database (${databaseName}) to do it: `,
        ));
    if (answer.trim() !== databaseName) {
        console.log("Not the name of the database: nothing was changed.");
        process.exit(1);
    }

    await sql.begin(async (transaction) => {
        // Documents are not created while this runs (they wait for the commit); reading goes on.
        await transaction`lock table documents, document_counters in share row exclusive mode`;

        const rows = renumbered.map(({ id, newKey, newNumber, newSearchText }) => ({
            id,
            key: newKey,
            number: newNumber,
            search_text: newSearchText,
        }));
        await transaction`
            update documents d
            set sequence_key = r.key,
                document_number = r.number,
                search_text = r.search_text,
                input = case when jsonb_typeof(d.input -> 'requestedNumber') = 'number'
                    then jsonb_set(d.input, '{requestedNumber}', to_jsonb(r.number)) else d.input end
            from jsonb_to_recordset(${transaction.json(rows as never)}) as r(id uuid, key text, number int, search_text text)
            where d.id = r.id
        `;

        for (const [key, last] of lastNumber) {
            await transaction`
                insert into document_counters (sequence_key, last_number) values (${key}, ${last})
                on conflict (sequence_key) do update
                    set last_number = greatest(document_counters.last_number, excluded.last_number)
            `;
        }
        await transaction`delete from document_counters where sequence_key !~ ':[0-9]{4}$'`;

        await transaction`
            insert into audit_log (user_id, user_label, action, entity_type, details)
            values (null, 'db:renumber', 'documents.renumber', 'documents', ${transaction.json({
                count: renumbered.length,
                documents: renumbered.map((document) => ({
                    id: document.id,
                    oldSequence: document.sequenceKey,
                    oldNumber: document.documentNumber,
                    newSequence: document.newKey,
                    newNumber: document.newNumber,
                })),
            } as never)})
        `;

        const [{ left }] = await transaction<{ left: number }[]>`
            select count(*)::int as left from documents where sequence_key !~ ':[0-9]{4}$'
        `;
        if (left !== 0) throw new Error(`${left} documents still have a sequence without a year.`);
    });

    console.log("\nDone. The numbers now:");
    const now = await sql<{ key: string; count: number; last: number }[]>`
        select sequence_key as key, count(*)::int as count, max(document_number) as last
        from documents group by sequence_key order by sequence_key
    `;
    for (const row of now) console.log(`  ${row.key.padEnd(28)} ${String(row.count).padStart(4)} documents, last n. ${row.last}`);
} catch (error) {
    console.error("Renumbering failed, nothing was changed:", error instanceof Error ? error.message || (error as NodeJS.ErrnoException).code || error.name : error);
    process.exitCode = 1;
} finally {
    await sql.end();
    process.stdin.destroy();
}
