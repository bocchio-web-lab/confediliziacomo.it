// Applies every pending SQL file in `db/migrations`, in alphabetical order.
// Usage: npm run db:migrate
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const MIGRATIONS_DIRECTORY = join(import.meta.dirname, "..", "..", "db", "migrations");

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    process.exit(1);
}

const sql = postgres(connectionString, { max: 1, onnotice: () => {} });

try {
    await sql`
        create table if not exists schema_migrations (
            name text primary key,
            applied_at timestamptz not null default now()
        )
    `;

    const applied = new Set(
        (await sql<{ name: string }[]>`select name from schema_migrations`).map((row) => row.name),
    );
    const files = (await readdir(MIGRATIONS_DIRECTORY)).filter((file) => file.endsWith(".sql")).sort();

    let appliedCount = 0;
    for (const file of files) {
        if (applied.has(file)) continue;

        const migration = await readFile(join(MIGRATIONS_DIRECTORY, file), "utf8");
        await sql.begin(async (transaction) => {
            await transaction.unsafe(migration);
            await transaction`insert into schema_migrations (name) values (${file})`;
        });
        console.log(`Applied ${file}`);
        appliedCount++;
    }

    console.log(appliedCount === 0 ? "Database already up to date." : `Done (${appliedCount} applied).`);
} catch (error) {
    console.error("Migration failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
} finally {
    await sql.end();
}
