import { sql } from "./db.ts";
import type { SessionUser } from "./auth.ts";

export interface AuditEntry {
    action: string;
    entityType: string;
    entityId?: string | null;
    details?: Record<string, unknown>;
}

/** Records who did what. `user` is null for events that happen before authentication. */
export async function recordAudit(user: SessionUser | null, entry: AuditEntry, label?: string) {
    await sql`
        insert into audit_log (user_id, user_label, action, entity_type, entity_id, details)
        values (
            ${user?.id ?? null},
            ${user ? `${user.name} <${user.email}>` : (label ?? "anonymous")},
            ${entry.action},
            ${entry.entityType},
            ${entry.entityId ?? null},
            ${sql.json((entry.details ?? {}) as never)}
        )
    `;
}

export interface AuditLogRow {
    id: number;
    userLabel: string;
    action: string;
    entityType: string;
    entityId: string | null;
    details: Record<string, unknown>;
    createdAt: string;
}

export async function listRecentAudit(limit = 10) {
    return sql<AuditLogRow[]>`
        select id, user_label as "userLabel", action, entity_type as "entityType",
               entity_id as "entityId", details, created_at::text as "createdAt"
        from audit_log
        order by id desc
        limit ${limit}
    `;
}
