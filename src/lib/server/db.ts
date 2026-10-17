import postgres from "postgres";
import { DATABASE_URL } from "$app/env/private";

if (!DATABASE_URL) {
    console.warn("DATABASE_URL is not set: database queries will fail.");
}

/**
 * Shared PostgreSQL client. It connects lazily, on the first query.
 *
 * Settings chosen for Neon behind its connection pooler (PgBouncer in transaction mode)
 * and for serverless functions:
 * - `prepare: false`: the pooler does not support prepared statements.
 * - `max`: each function instance only needs a few connections; the pooler does the rest.
 * - `connect_timeout`: Neon may be waking up from auto-suspend, which takes a moment.
 */
export const sql = postgres(DATABASE_URL ?? "", {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 30,
    onnotice: () => {},
});
