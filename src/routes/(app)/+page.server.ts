import { redirect } from "@sveltejs/kit";
import { findIstatIndex, isValidIsoDate } from "#lib/accords/calculate.ts";
import { TERRITORY_SLUGS } from "#lib/accords/registry.ts";
import { KIND_SLUGS } from "#lib/documents/types.ts";
import { todayIso } from "#lib/format.ts";
import { DOCUMENTS_PAGE_SIZE, listDocuments } from "#lib/server/documents.ts";
import { listIstatIndices } from "#lib/server/istat.ts";
import type { PageServerLoad } from "./$types";

const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 100_000;

const validDate = (value: string | null) => (value && isValidIsoDate(value) ? value : "");

/** The slug if it is one of the known ones, otherwise an empty string (Object.hasOwn: "constructor" is not a slug). */
const knownSlug = (slugs: Record<string, unknown>, value: string | null) =>
    value && Object.hasOwn(slugs, value) ? value : "";

export const load: PageServerLoad = async ({ url }) => {
    const params = url.searchParams;
    const requestedPage = Number(params.get("pagina"));
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, MAX_PAGE) : 1;

    // The filters live in the address, so a search can be bookmarked and the back button works.
    const kindSlug = knownSlug(KIND_SLUGS, params.get("tipo"));
    const territorySlug = knownSlug(TERRITORY_SLUGS, params.get("territorio"));
    const filters = {
        query: (params.get("q") ?? "").slice(0, MAX_QUERY_LENGTH),
        from: validDate(params.get("dal")),
        to: validDate(params.get("al")),
        kind: kindSlug ? KIND_SLUGS[kindSlug] : null,
        territory: territorySlug ? TERRITORY_SLUGS[territorySlug] : null,
    };

    const [{ rows, total }, indices] = await Promise.all([listDocuments(filters, page), listIstatIndices()]);

    // A page after the last one (e.g. an old bookmark) leads to the last page.
    const pageCount = Math.max(1, Math.ceil(total / DOCUMENTS_PAGE_SIZE));
    if (page > pageCount) {
        const corrected = new URLSearchParams(url.search);
        if (pageCount > 1) corrected.set("pagina", String(pageCount));
        else corrected.delete("pagina");
        const search = corrected.toString();
        redirect(303, search ? `${url.pathname}?${search}` : url.pathname);
    }

    const today = todayIso();
    const currentIndex = findIstatIndex(indices, today);

    return {
        filters: { query: filters.query, from: filters.from, to: filters.to, kind: kindSlug, territory: territorySlug },
        page,
        pageSize: DOCUMENTS_PAGE_SIZE,
        total,
        documents: rows,
        istat: {
            latest: indices.at(-1) ?? null,
            // The index of the current month is missing when the latest row starts in an earlier month.
            isCurrentMonthMissing: !currentIndex || currentIndex.validFrom.slice(0, 7) < today.slice(0, 7),
        },
    };
};
