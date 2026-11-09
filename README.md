# Confedilizia Como

Private area of the Associazione della Proprietà Edilizia di Como: prospetti di calcolo and attestazioni di
rispondenza for the Comune and the Provincia di Como. SvelteKit + Tailwind + shadcn-svelte, deployed on
Netlify, PostgreSQL on [Neon](https://neon.tech).

The home page (`/`) is the list of documents; anonymous visitors are sent to `/login`. The public pages of the
old website are kept, switched off, in `src/site-routes` (see the README there).

## Develop

```sh
npm install
cp .env.example .env     # fill in the values (see below)
npm run db:migrate       # applies the migrations that are missing (safe to repeat)
npm run db:create-user -- --email name@example.it --name "Name Surname"
npm run dev
```

Useful commands: `npm run check` (types), `npm test` (calculation engine and helpers), `npm run build`.

### Starting again from zero

`npm run db:reset` erases the whole database (every table and type, with the data) after showing what is in it
and asking to type the name of the database; `npm run db:fresh` does the same and then creates the tables again.
It acts on `DATABASE_URL_UNPOOLED` (or `DATABASE_URL`): to act on production set that variable for the single
command (PowerShell: `$env:DATABASE_URL_UNPOOLED = "<direct url>"; npm run db:fresh`, then close the terminal).
The migrations in `db/migrations` describe the final tables, so a database made before they were rewritten must
be reset, not migrated. After a reset there are no users: create them again (see Accounts).

## Accounts

- **Sign up** (`/register`) needs the secret `REGISTRATION_CODE`: give it only to the people who may use the
  tool. Without the variable the page does not exist.
- **Forgot password** (`/forgot-password`) emails a link valid for one hour. Configure `SMTP_*` (and `SITE_URL`);
  in development, without SMTP, the link is printed in the terminal.
- From the command line: `npm run db:create-user -- --email ... --name ...` creates a user or resets the
  password; `--file users.local.csv` (lines `email,name[,password]`, the file is git-ignored) creates many, and
  `--sql` prints the `INSERT` statements (with password hashes) to run by hand in the Neon SQL editor.

## Documents and numbers

Every document gets an automatic progressive number. There is one sequence for each combination of kind,
territory (prospetti/attestazioni × Comune/Provincia) and year, and the numbers start again from 1 every year. The
year is the one in which the document is created (not the one of the contract). Numbers are never reused, and a
number can be typed by hand when a document is created. The policy is in `src/lib/documents/numbering.ts`.

`npm run db:renumber` moves the documents made before the numbering was yearly (sequence without a year) to the
yearly sequences, in order of creation; `-- --dry-run` shows the new numbers without changing anything. The
historical Excel files are imported with `scripts/import` (see its README).

The signature and stamp printed on prospetti is `src/lib/server/assets/firma-timbro.png`; it is served only to
logged-in users (`/api/signature`).

## Database (Neon)

### One-time setup in Neon

1. Create a project: **name** `confedilizia-como`, **Postgres version** the latest offered, **region** AWS Europe
   (Frankfurt) `eu-central-1`, **database name** `confediliziacomo` (the default role `neondb_owner` is fine).
2. The default branch (`main`) is production. Create a child branch `dev` from it for local development and for
   deploy previews.
3. In the **Connect** dialog pick a branch, then copy two strings:
   - with **Connection pooling** on (host contains `-pooler`) → `DATABASE_URL`;
   - with it off → `DATABASE_URL_UNPOOLED`.

To run a script against production, override the variable for that command only (the real environment wins over
`.env`), e.g. in PowerShell:
`$env:DATABASE_URL_UNPOOLED = "<production direct url>"; npm run db:create-user -- ...`.

### Netlify

Site configuration → Environment variables (mark them as secrets):

| Variable                                          | Scopes             | Production            | Previews / branch deploys |
| ------------------------------------------------- | ------------------ | --------------------- | ------------------------- |
| `DATABASE_URL`                                    | Functions, Runtime | pooled URL of `main`  | pooled URL of `dev`       |
| `DATABASE_URL_UNPOOLED`                           | Builds             | direct URL of `main`  | direct URL of `dev`       |
| `REGISTRATION_CODE`, `SITE_URL`, `SMTP_*`         | Functions, Runtime | as in `.env.example`  | optional                  |

`netlify.toml` runs `npm run db:migrate` before the build of **production** deploys only. Migrations are recorded in
the `schema_migrations` table and applied once, so deploying never resets the data (but a migration can change it:
read new ones before merging). To change the schema add a new
file in `db/migrations` (never edit an applied one: the script refuses it).

## Troubleshooting

**The Netlify build stops after `Database: ...` (migration lock).** Runs of `db:migrate` take a lock so that two of
them never migrate together. A run that was killed (a cancelled build, a closed terminal) can leave its connection
open on the server, still holding the lock. The script now waits for the lock at most 90 seconds (then fails with a
clear message) and closes a holder that has been idle for 5 minutes. To look at it by hand, in the Neon SQL editor
(database `confediliziacomo`):

```sql
-- Who is connected, and since when are they doing nothing?
select pid, application_name, state, state_change, left(query, 80) as query
from pg_stat_activity where datname = 'confediliziacomo' order by state_change;

-- Who holds the migration lock?
select pid from pg_locks where locktype = 'advisory' and objid = 7251908 and granted;

-- Close a connection that is stuck (use the pid found above)
select pg_terminate_backend(12345);
```
