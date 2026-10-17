import type { IstatIndex } from "#lib/accords/types.ts";
import { recordAudit } from "./audit.ts";
import type { SessionUser } from "./auth.ts";
import { sql } from "./db.ts";

export interface IstatIndexRow extends IstatIndex {
    updatedAt: string;
    updatedByName: string | null;
}

export async function listIstatIndices(): Promise<IstatIndex[]> {
    return sql<IstatIndex[]>`
        select valid_from::text as "validFrom", coefficient::float8 as coefficient
        from istat_indices
        order by valid_from
    `;
}

export async function listIstatIndexRows(): Promise<IstatIndexRow[]> {
    return sql<IstatIndexRow[]>`
        select i.valid_from::text as "validFrom", i.coefficient::float8 as coefficient,
               i.updated_at::text as "updatedAt", u.name as "updatedByName"
        from istat_indices i
        left join users u on u.id = i.updated_by
        order by i.valid_from desc
    `;
}

/** Inserts the coefficient for `validFrom`, or replaces it if the date is already present. */
export async function saveIstatIndex(user: SessionUser, validFrom: string, coefficient: number) {
    const [previous] = await sql<{ coefficient: number }[]>`
        select coefficient::float8 as coefficient from istat_indices where valid_from = ${validFrom}
    `;

    await sql`
        insert into istat_indices (valid_from, coefficient, created_by, updated_by)
        values (${validFrom}, ${coefficient}, ${user.id}, ${user.id})
        on conflict (valid_from) do update
            set coefficient = excluded.coefficient, updated_by = excluded.updated_by, updated_at = now()
    `;

    await recordAudit(user, {
        action: previous ? "istat.update" : "istat.create",
        entityType: "istat_index",
        entityId: validFrom,
        details: { coefficient, previousCoefficient: previous?.coefficient ?? null },
    });
}

export async function deleteIstatIndex(user: SessionUser, validFrom: string) {
    const [deleted] = await sql<{ coefficient: number }[]>`
        delete from istat_indices where valid_from = ${validFrom} returning coefficient::float8 as coefficient
    `;
    if (!deleted) return false;

    await recordAudit(user, {
        action: "istat.delete",
        entityType: "istat_index",
        entityId: validFrom,
        details: { coefficient: deleted.coefficient },
    });
    return true;
}
