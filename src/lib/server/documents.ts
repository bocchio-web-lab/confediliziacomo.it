import { calculate } from "#lib/accords/calculate.ts";
import { accordById, accordForForm, resolveAccord } from "#lib/accords/registry.ts";
import type { CalculationResult, Territory } from "#lib/accords/types.ts";
import { numberingYear, sequenceKey } from "#lib/documents/numbering.ts";
import { buildSearchText, searchTerms } from "#lib/documents/search.ts";
import {
    dateNameOf,
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
async function prepareDocument(kind: DocumentKind, territory: Territory, rawData: unknown): Promise<PreparedDocument> {
    const contractDate = (rawData as { calculation?: { contractDate?: unknown } })?.calculation?.contractDate;
    const accord = typeof contractDate === "string" ? resolveAccord(territory, contractDate) : null;
    if (!accord) {
        throw new DocumentValidationError(["Nessun accordo territoriale in vigore alla data indicata."]);
    }

    const data = sanitizeDocumentData(rawData, accord);
    // A prospectus has a single date: the one printed on it is also the reference of the calculation.
    if (kind === "prospectus") data.details.issueDate = data.calculation.contractDate;

    const result = calculate(accord, data.calculation, await listIstatIndices(), dateNameOf(kind));
    if (result.issues.length > 0) throw new DocumentValidationError(result.issues);

    const title = data.details.landlord.name || data.details.address || "Senza nome né indirizzo";
    return { accordId: accord.id, data, result, title };
}

// --- Reading -----------------------------------------------------------------------------

const SUMMARY_COLUMNS = sql`
    d.id, d.kind, d.territory, d.document_number as "documentNumber",
    d.applicant_name as "applicantName", d.address,
    d.contract_date::text as "contractDate",
    d.created_at::text as "createdAt", cu.name as "createdByName",
    d.updated_at::text as "updatedAt", uu.name as "updatedByName"
`;

export interface DocumentFilters {
    /** Words that must all appear in the names, address or number. */
    query: string;
    /** First and last day (ISO) of the period in which the document was created. */
    from: string;
    to: string;
    kind: DocumentKind | null;
    territory: Territory | null;
}

export const DOCUMENTS_PAGE_SIZE = 25;

export async function listDocuments(filters: DocumentFilters, page: number) {
    const conditions = [sql`d.deleted_at is null`];

    for (const term of searchTerms(filters.query)) {
        const escaped = term.replace(/[\\%_]/g, (character) => `\\${character}`);
        conditions.push(sql`d.search_text like ${`%${escaped}%`}`);
    }
    // Days are those of Italy, not of the server.
    if (filters.from) conditions.push(sql`(d.created_at at time zone 'Europe/Rome')::date >= ${filters.from}::date`);
    if (filters.to) conditions.push(sql`(d.created_at at time zone 'Europe/Rome')::date <= ${filters.to}::date`);
    if (filters.kind) conditions.push(sql`d.kind = ${filters.kind}`);
    if (filters.territory) conditions.push(sql`d.territory = ${filters.territory}`);

    const where = conditions.reduce((all, condition) => sql`${all} and ${condition}`);

    const [rows, [{ total }]] = await Promise.all([
        sql<DocumentSummary[]>`
            select ${SUMMARY_COLUMNS}
            from documents d
            join users cu on cu.id = d.created_by
            join users uu on uu.id = d.updated_by
            where ${where}
            order by d.created_at desc, d.id
            limit ${DOCUMENTS_PAGE_SIZE} offset ${(page - 1) * DOCUMENTS_PAGE_SIZE}
        `,
        sql<{ total: number }[]>`select count(*)::int as total from documents d where ${where}`,
    ]);
    return { rows, total };
}

export async function getDocument(id: string, kind?: DocumentKind): Promise<StoredDocument | null> {
    const [row] = await sql<(Omit<StoredDocument, "data"> & { data: unknown })[]>`
        select d.id, d.kind, d.territory, d.accord_id as "accordId", d.document_number as "documentNumber",
               d.contract_date::text as "contractDate", d.title, d.input as data, d.result,
               d.created_at::text as "createdAt", cu.name as "createdByName",
               d.updated_at::text as "updatedAt", uu.name as "updatedByName"
        from documents d
        join users cu on cu.id = d.created_by
        join users uu on uu.id = d.updated_by
        where d.id = ${id} and d.deleted_at is null ${kind ? sql`and d.kind = ${kind}` : sql``}
    `;
    if (!row) return null;

    // Older documents may lack the fields added later: sanitizing fills them in.
    const accord = accordById(row.accordId) ?? accordForForm(row.territory, row.contractDate);
    return { ...row, data: sanitizeDocumentData(row.data, accord) };
}

/** The number the next document created now will get, unless another one is saved first. */
export async function nextDocumentNumber(kind: DocumentKind, territory: Territory) {
    const [counter] = await sql<{ lastNumber: number }[]>`
        select last_number as "lastNumber" from document_counters
        where sequence_key = ${sequenceKey(kind, territory, numberingYear())}
    `;
    return (counter?.lastNumber ?? 0) + 1;
}

// --- Writing -----------------------------------------------------------------------------

export async function createDocument(user: SessionUser, kind: DocumentKind, territory: Territory, rawData: unknown) {
    const prepared = await prepareDocument(kind, territory, rawData);
    const key = sequenceKey(kind, territory, numberingYear());
    const requestedNumber = prepared.data.requestedNumber;

    try {
        const created = await sql.begin(async (transaction) => {
            // The counter row is locked until the end of the transaction, so numbers are handed out one at a time.
            const [counter] = await transaction<{ lastNumber: number }[]>`
                insert into document_counters (sequence_key, last_number)
                values (${key}, ${requestedNumber ?? 1})
                on conflict (sequence_key) do update
                    set last_number = case
                        when ${requestedNumber}::integer is null then document_counters.last_number + 1
                        else greatest(document_counters.last_number, ${requestedNumber}::integer)
                    end
                returning last_number as "lastNumber"
            `;
            const documentNumber = requestedNumber ?? counter.lastNumber;

            const [row] = await transaction<{ id: string }[]>`
                insert into documents (
                    kind, territory, accord_id, sequence_key, document_number, contract_date, title,
                    applicant_name, address, search_text, input, result, created_by, updated_by
                )
                values (
                    ${kind}, ${territory}, ${prepared.accordId}, ${key}, ${documentNumber},
                    ${prepared.data.calculation.contractDate}, ${prepared.title},
                    ${prepared.data.details.landlord.name}, ${prepared.data.details.address},
                    ${buildSearchText(prepared.data, documentNumber)},
                    ${sql.json(prepared.data as never)}, ${sql.json(prepared.result as never)},
                    ${user.id}, ${user.id}
                )
                returning id
            `;
            return { id: row.id, documentNumber };
        });

        await recordAudit(user, {
            action: "document.create",
            entityType: kind,
            entityId: created.id,
            details: { territory, accordId: prepared.accordId, title: prepared.title, number: created.documentNumber },
        });
        return created.id;
    } catch (error) {
        // 23505 = unique violation: the requested number is already used in this sequence.
        if ((error as { code?: string }).code === "23505" && requestedNumber !== null) {
            throw new DocumentValidationError([`Il numero ${requestedNumber} è già stato assegnato a un altro documento.`]);
        }
        throw error;
    }
}

export async function updateDocument(user: SessionUser, kind: DocumentKind, id: string, rawData: unknown) {
    const existing = await getDocument(id, kind);
    if (!existing) return false;

    const prepared = await prepareDocument(kind, existing.territory, rawData);

    await sql`
        update documents
        set accord_id = ${prepared.accordId}, contract_date = ${prepared.data.calculation.contractDate},
            title = ${prepared.title}, applicant_name = ${prepared.data.details.landlord.name},
            address = ${prepared.data.details.address},
            search_text = ${buildSearchText(prepared.data, existing.documentNumber)},
            input = ${sql.json(prepared.data as never)}, result = ${sql.json(prepared.result as never)},
            updated_by = ${user.id}, updated_at = now()
        where id = ${id} and kind = ${kind}
    `;

    await recordAudit(user, {
        action: "document.update",
        entityType: kind,
        entityId: id,
        details: { title: prepared.title, accordId: prepared.accordId, number: existing.documentNumber },
    });
    return true;
}

/** Documents are never physically removed: they are hidden and the audit log keeps the trace. */
export async function deleteDocument(user: SessionUser, kind: DocumentKind, id: string) {
    const [deleted] = await sql<{ title: string; documentNumber: number }[]>`
        update documents set deleted_at = now(), deleted_by = ${user.id}
        where id = ${id} and kind = ${kind} and deleted_at is null
        returning title, document_number as "documentNumber"
    `;
    if (!deleted) return false;

    await recordAudit(user, {
        action: "document.delete",
        entityType: kind,
        entityId: id,
        details: { title: deleted.title, number: deleted.documentNumber },
    });
    return true;
}
