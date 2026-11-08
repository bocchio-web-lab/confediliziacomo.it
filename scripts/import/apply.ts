// Runs the SQL file made by `generate-sql.ts` on the database, after showing which one it is and asking to type
// its name. The file is one transaction: it is applied completely or not at all.
//
// Usage: npm run import:apply -- <import.sql>
//        npm run import:apply -- <import.sql> --confirm <database name>     without the question
//
// It acts on DATABASE_URL_UNPOOLED (or DATABASE_URL). To act on production set that variable for the single
// command (PowerShell: `$env:DATABASE_URL_UNPOOLED = "<direct url>"; npm run import:apply -- ...`).
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import postgres from "postgres";

const { values, positionals } = parseArgs({ allowPositionals: true, options: { confirm: { type: "string" } } });
const [file] = positionals;
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!file || !connectionString) {
    console.error("Usage: npm run import:apply -- <import.sql>   (with DATABASE_URL_UNPOOLED or DATABASE_URL set)");
    process.exit(1);
}

const { host, pathname } = new URL(connectionString);
const databaseName = decodeURIComponent(pathname.slice(1));
const script = await readFile(file, "utf8");
const sql = postgres(connectionString, { max: 1, connect_timeout: 60, onnotice: () => {} });

try {
    console.log(`Database: ${host}/${databaseName}`);
    const counts = await sql<{ users: number; documents: number }[]>`
        select (select count(*) from users)::int as users, (select count(*) from documents)::int as documents
    `;
    console.log(`It holds ${counts[0].users} users and ${counts[0].documents} documents.`);
    console.log(`${file}: ${(script.length / 1024).toFixed(0)} KB.`);

    const answer =
        values.confirm ??
        (await createInterface({ input: process.stdin, output: process.stdout }).question(
            `\nType the name of the database (${databaseName}) to apply the file to it: `,
        ));
    if (answer.trim() !== databaseName) {
        console.log("Not the name of the database: nothing was done.");
        process.exit(1);
    }

    await sql.unsafe(script);
    const after = await sql<{ documents: number }[]>`select count(*)::int as documents from documents`;
    console.log(`Done. The database now holds ${after[0].documents} documents.`);
} catch (error) {
    // The file is a single transaction: leave nothing half done on the connection before it closes.
    await sql.unsafe("rollback").catch(() => {});
    console.error("Failed, nothing was changed:", error instanceof Error ? error.message || (error as NodeJS.ErrnoException).code || error.name : error);
    process.exitCode = 1;
} finally {
    await sql.end();
    process.stdin.destroy();
}
