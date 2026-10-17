// Applies every pending SQL file in `db/migrations`, in alphabetical order.
// It only ever adds: applied migrations are recorded in `schema_migrations` and never run twice,
// and nothing is dropped. Safe to run at every deploy.
// Usage: npm run db:migrate
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const MIGRATIONS_DIRECTORY = join(import.meta.dirname, "..", "..", "db", "migrations");
// Arbitrary constant: concurrent runs (e.g. two deploys) wait for each other.
const MIGRATION_LOCK_ID = 7_251_908;

// Migrations change the schema, so they need a direct (non-pooled) connection.
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set.");
    process.exit(1);
}

const checksum = (content: string) => createHash("sha256").update(content).digest("hex");

const sql = postgres(connectionString, { max: 1, connect_timeout: 60, onnotice: () => {} });

try {
    const { host, pathname } = new URL(connectionString);
    console.log(`Database: ${host}${pathname}`);

    await sql`select pg_advisory_lock(${MIGRATION_LOCK_ID})`;

    await sql`
        create table if not exists schema_migrations (
            name text primary key,
            applied_at timestamptz not null default now()
        )
    `;
    await sql`alter table schema_migrations add column if not exists checksum text`;

    const applied = new Map(
        (await sql<{ name: string; checksum: string | null }[]>`select name, checksum from schema_migrations`).map(
            (row) => [row.name, row.checksum],
        ),
    );
    const files = (await readdir(MIGRATIONS_DIRECTORY)).filter((file) => file.endsWith(".sql")).sort();

    let appliedCount = 0;
    for (const file of files) {
        const migration = await readFile(join(MIGRATIONS_DIRECTORY, file), "utf8");
        const fingerprint = checksum(migration);

        if (applied.has(file)) {
            const stored = applied.get(file);
            if (stored && stored !== fingerprint) {
                throw new Error(`${file} was modified after being applied. Write a new migration instead.`);
            }
            if (!stored) await sql`update schema_migrations set checksum = ${fingerprint} where name = ${file}`;
            continue;
        }

        await sql.begin(async (transaction) => {
            await transaction.unsafe(migration);
            await transaction`insert into schema_migrations (name, checksum) values (${file}, ${fingerprint})`;
        });
        console.log(`Applied ${file}`);
        appliedCount++;
    }

    console.log(appliedCount === 0 ? "Database already up to date." : `Done (${appliedCount} applied).`);
} catch (error) {
    console.error("Migration failed:", error instanceof Error ? error.message || (error as NodeJS.ErrnoException).code || error.name : error);
    process.exitCode = 1;
} finally {
    await sql.end();
}
