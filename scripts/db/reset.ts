// Erases the whole database: every table and type is dropped, with all the data. It is meant for
// starting again from nothing; run `npm run db:migrate` afterwards to create the tables again.
//
// Usage: npm run db:reset      asks to type the name of the database before doing anything
//        npm run db:fresh      the same, then runs the migrations
//        npm run db:reset -- --confirm <database name>     without the question
//
// It acts on DATABASE_URL_UNPOOLED (or DATABASE_URL): the host is printed first. To act on the
// production database set that variable for the single command (the real environment wins over .env).
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import postgres from "postgres";

const { values } = parseArgs({ options: { confirm: { type: "string" } } });

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set.");
    process.exit(1);
}

const { host, pathname } = new URL(connectionString);
const databaseName = decodeURIComponent(pathname.slice(1));

// Tables, enum types and sequences of the `public` schema, except the ones that belong to an extension.
// Indexes, constraints and the sequences of serial columns go away with their tables.
const DROP_EVERYTHING = `
do $$
declare item record;
begin
    for item in
        select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('r', 'p')
          and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
    loop
        execute format('drop table if exists public.%I cascade', item.relname);
    end loop;

    for item in
        select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace
        where n.nspname = 'public' and t.typtype = 'e'
          and not exists (select 1 from pg_depend d where d.objid = t.oid and d.deptype = 'e')
    loop
        execute format('drop type if exists public.%I cascade', item.typname);
    end loop;

    for item in
        select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'S'
          and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
    loop
        execute format('drop sequence if exists public.%I cascade', item.relname);
    end loop;
end
$$;
`;

const sql = postgres(connectionString, { max: 1, connect_timeout: 60, onnotice: () => {} });

try {
    console.log(`Database: ${host}/${databaseName}`);

    const tables = await sql<{ name: string }[]>`
        select tablename as name from pg_tables where schemaname = 'public' order by tablename
    `;
    if (tables.length === 0) {
        console.log("The database is already empty.");
    } else {
        console.log("\nWhat is in it now, and is about to be erased:");
        for (const { name } of tables) {
            const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from ${sql(name)}`;
            console.log(`  ${name.padEnd(28)} ${count} rows`);
        }
    }

    const answer =
        values.confirm ??
        (await createInterface({ input: process.stdin, output: process.stdout }).question(
            `\nThis cannot be undone. Type the name of the database (${databaseName}) to erase it: `,
        ));
    if (answer.trim() !== databaseName) {
        console.log("Not the name of the database: nothing was erased.");
        process.exit(1);
    }

    await sql.begin((transaction) => transaction.unsafe(DROP_EVERYTHING));
    console.log("\nEverything was erased. Create the tables again with: npm run db:migrate");
} catch (error) {
    console.error("Reset failed:", error instanceof Error ? error.message || (error as NodeJS.ErrnoException).code || error.name : error);
    process.exitCode = 1;
} finally {
    await sql.end();
    process.stdin.destroy();
}
