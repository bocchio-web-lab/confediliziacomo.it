// Applies every pending SQL file in `db/migrations`, in alphabetical order.
// Applied migrations are recorded in `schema_migrations` and never run twice, and an applied file that was
// edited is refused, so it is safe to run at every deploy. What a migration does is up to its SQL: read it.
// Usage: npm run db:migrate
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const MIGRATIONS_DIRECTORY = join(import.meta.dirname, "..", "..", "db", "migrations");
// Arbitrary constant: concurrent runs (e.g. two deploys) wait for each other.
const MIGRATION_LOCK_ID = 7_251_908;
const APPLICATION_NAME = "confedilizia-migrate";

// A run that was killed (e.g. a cancelled build) can leave its connection open on the server for a long
// time, still holding the lock. Waiting for it forever would hang every following deploy, so:
// - the lock is waited for this long, then the run fails with a clear message;
// - a holder that has done nothing for this long is certainly dead and its connection is closed.
const LOCK_WAIT_SECONDS = Number(process.env.MIGRATE_LOCK_WAIT_SECONDS ?? 90);
const STALE_HOLDER_SECONDS = Number(process.env.MIGRATE_STALE_HOLDER_SECONDS ?? 300);

// Migrations change the schema, so they need a direct (non-pooled) connection.
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set.");
    process.exit(1);
}

const checksum = (content: string) => createHash("sha256").update(content).digest("hex");

const sql = postgres(connectionString, {
    max: 1,
    connect_timeout: 60,
    onnotice: () => {},
    connection: { application_name: APPLICATION_NAME },
});

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Closes the connections that hold the lock and have been idle for long: they belong to earlier runs of this
 * script (also those of the versions that did not set an application name) that died without letting go.
 */
async function closeStaleHolders() {
    const closed = await sql<{ pid: number }[]>`
        select pid, pg_terminate_backend(pid) as terminated
        from pg_stat_activity
        where pid <> pg_backend_pid()
          and state = 'idle'
          and state_change < now() - make_interval(secs => ${STALE_HOLDER_SECONDS})
          and pid in (
              select pid from pg_locks
              where locktype = 'advisory' and classid = 0 and objid = ${MIGRATION_LOCK_ID} and objsubid = 1 and granted
          )
    `;
    for (const { pid } of closed) console.log(`Closed the connection ${pid} of an earlier run that left the lock behind.`);
}

/** Waits for the lock that keeps two runs from migrating at the same time. */
async function acquireMigrationLock() {
    const deadline = Date.now() + LOCK_WAIT_SECONDS * 1000;
    let isWaiting = false;

    for (;;) {
        const [{ isLocked }] = await sql<{ isLocked: boolean }[]>`
            select pg_try_advisory_lock(${MIGRATION_LOCK_ID}) as "isLocked"
        `;
        if (isLocked) return;

        if (!isWaiting) console.log("Another migration run is in progress: waiting for it to finish...");
        isWaiting = true;

        await closeStaleHolders();
        if (Date.now() > deadline) {
            throw new Error(
                `The migration lock is still held after ${LOCK_WAIT_SECONDS} seconds. See "Troubleshooting" in README.md.`,
            );
        }
        await sleep(2000);
    }
}

try {
    const { host, pathname } = new URL(connectionString);
    console.log(`Database: ${host}${pathname}`);

    // No statement can wait for ever: better a failed deploy than a hung one.
    await sql`set statement_timeout to 300000`;
    await sql`set lock_timeout to 60000`;
    console.log("Connected.");
    await acquireMigrationLock();

    await sql`
        create table if not exists schema_migrations (
            name text primary key,
            checksum text,
            applied_at timestamptz not null default now()
        )
    `;

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
