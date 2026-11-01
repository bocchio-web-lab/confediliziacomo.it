import { error, json } from "@sveltejs/kit";
import { getDocument } from "#lib/server/documents.ts";
import { listIstatIndices } from "#lib/server/istat.ts";
import type { RequestHandler } from "./$types";

/** A saved document with the ISTAT indices, so that the browser can recalculate it and make its PDF. */
export const GET: RequestHandler = async ({ params }) => {
    const document = await getDocument(params.id);
    if (!document) error(404, "Documento non trovato");

    return json({ document, indices: await listIstatIndices() }, { headers: { "cache-control": "no-store" } });
};
