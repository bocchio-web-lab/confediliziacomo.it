import { calculate } from "#lib/accords/calculate.ts";
import { resolveAccord } from "#lib/accords/registry.ts";
import type { CalculationResult, Territory } from "#lib/accords/types.ts";
import {
    sanitizeDocumentData,
    type DocumentData,
    type DocumentKind,
    type DocumentSummary,
    type StoredDocument,
} from "#lib/documents/types.ts";
import { recordAudit } from "./audit.ts";
import type { SessionUser } from "./auth.ts";
import { sql } from "./db.ts";
import { listIstatIndices } from "./istat.ts";

export class DocumentValidationError extends Error {
    constructor(readonly issues: string[]) {
        super(issues.join(" "));
    }
}

interface PreparedDocument {
    accordId: string;
    data: DocumentData;
    result: CalculationResult;
    title: string;
}

/**
 * Validates what the browser sent and recomputes the result on the server: the saved
 * numbers never depend on what the client claims to have calculated.
 */
async function prepareDocument(territory: Territory, rawData: unknown): Promise<PreparedDocument> {
    const contractDate = (rawData as { calculation?: { contractDate?: unknown } })?.calculation?.contractDate;
    const accord = typeof contractDate === "string" ? resolveAccord(territory, contractDate) : null;
    if (!accord) {
        throw new DocumentValidationError(["Nessun accordo territoriale in vigore alla data di stipula indicata."]);
    }

    const data = sanitizeDocumentData(rawData, accord);
    const result = calculate(accord, data.calculation, await listIstatIndices());
    if (result.issues.length > 0) throw new DocumentValidationError(result.issues);

    return { accordId: accord.id, data, result, title: data.details.address || "Senza indirizzo" };
}

const SUMMARY_COLUMNS = sql`
    d.id, d.number, d.title, d.territory, d.contract_date::text as "contractDate",
    (d.result #>> '{monthly,min}')::float8 as "monthlyMin",
    (d.result #>> '{monthly,max}')::float8 as "monthlyMax",
    d.created_at::text as "createdAt", cu.name as "createdByName",
    d.updated_at::text as "updatedAt", uu.name as "updatedByName"
`;

export async function listDocuments(kind: DocumentKind, limit = 200): Promise<DocumentSummary[]> {
    return sql<DocumentSummary[]>`
        select ${SUMMARY_COLUMNS}
        from documents d
        join users cu on cu.id = d.created_by
        join users uu on uu.id = d.updated_by
        where d.kind = ${kind} and d.deleted_at is null
        order by d.created_at desc
        limit ${limit}
    `;
}

export async function countDocuments() {
    const rows = await sql<{ kind: DocumentKind; count: number }[]>`
        select kind, count(*)::int as count from documents where deleted_at is null group by kind
    `;
    return Object.fromEntries(rows.map((row) => [row.kind, row.count])) as Partial<Record<DocumentKind, number>>;
}

export async function listRecentDocuments(limit = 5) {
    return sql<(DocumentSummary & { kind: DocumentKind })[]>`
        select d.kind, ${SUMMARY_COLUMNS}
        from documents d
        join users cu on cu.id = d.created_by
        join users uu on uu.id = d.updated_by
        where d.deleted_at is null
        order by d.updated_at desc
        limit ${limit}
    `;
}

export async function getDocument(kind: DocumentKind, id: string): Promise<StoredDocument | null> {
    const [document] = await sql<StoredDocument[]>`
        select d.id, d.kind, d.territory, d.accord_id as "accordId", d.number,
               d.contract_date::text as "contractDate", d.title, d.input as data, d.result,
               d.created_at::text as "createdAt", cu.name as "createdByName",
               d.updated_at::text as "updatedAt", uu.name as "updatedByName"
        from documents d
        join users cu on cu.id = d.created_by
        join users uu on uu.id = d.updated_by
        where d.id = ${id} and d.kind = ${kind} and d.deleted_at is null
    `;
    return document ?? null;
}

export async function createDocument(
    user: SessionUser,
    kind: DocumentKind,
    territory: Territory,
    rawData: unknown,
) {
    const prepared = await prepareDocument(territory, rawData);

    const [created] = await sql<{ id: string }[]>`
        insert into documents (kind, territory, accord_id, number, contract_date, title, input, result, created_by, updated_by)
        values (
            ${kind}, ${territory}, ${prepared.accordId}, ${prepared.data.details.number || null},
            ${prepared.data.calculation.contractDate}, ${prepared.title},
            ${sql.json(prepared.data as never)}, ${sql.json(prepared.result as never)},
            ${user.id}, ${user.id}
        )
        returning id
    `;

    await recordAudit(user, {
        action: "document.create",
        entityType: kind,
        entityId: created.id,
        details: { territory, accordId: prepared.accordId, title: prepared.title },
    });
    return created.id;
}

export async function updateDocument(user: SessionUser, kind: DocumentKind, id: string, rawData: unknown) {
    const existing = await getDocument(kind, id);
    if (!existing) return false;

    const prepared = await prepareDocument(existing.territory, rawData);

    await sql`
        update documents
        set accord_id = ${prepared.accordId}, number = ${prepared.data.details.number || null},
            contract_date = ${prepared.data.calculation.contractDate}, title = ${prepared.title},
            input = ${sql.json(prepared.data as never)}, result = ${sql.json(prepared.result as never)},
            updated_by = ${user.id}, updated_at = now()
        where id = ${id} and kind = ${kind}
    `;

    await recordAudit(user, {
        action: "document.update",
        entityType: kind,
        entityId: id,
        details: { title: prepared.title, accordId: prepared.accordId },
    });
    return true;
}

/** Documents are never physically removed: they are hidden and the audit log keeps the trace. */
export async function deleteDocument(user: SessionUser, kind: DocumentKind, id: string) {
    const [deleted] = await sql<{ title: string }[]>`
        update documents set deleted_at = now(), deleted_by = ${user.id}
        where id = ${id} and kind = ${kind} and deleted_at is null
        returning title
    `;
    if (!deleted) return false;

    await recordAudit(user, {
        action: "document.delete",
        entityType: kind,
        entityId: id,
        details: { title: deleted.title },
    });
    return true;
}
