import { KIND_SLUGS } from "#lib/documents/types.ts";
import { listDocuments } from "#lib/server/documents.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
    const kind = KIND_SLUGS[params.kind];
    return { kind, documents: await listDocuments(kind) };
};
