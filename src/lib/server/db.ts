import postgres from "postgres";
import { DATABASE_URL } from "$app/env/private";

if (!DATABASE_URL) {
    console.warn("DATABASE_URL is not set: database queries will fail.");
}

/** Shared PostgreSQL client. It connects lazily, on the first query. */
export const sql = postgres(DATABASE_URL ?? "", { onnotice: () => {} });
