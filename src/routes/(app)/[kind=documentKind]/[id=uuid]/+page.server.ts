import { error, fail, redirect } from "@sveltejs/kit";
import { KIND_LABELS, KIND_SLUGS } from "#lib/documents/types.ts";
import {
    DocumentValidationError,
    deleteDocument,
    getDocument,
    updateDocument,
} from "#lib/server/documents.ts";
import { listIstatIndices } from "#lib/server/istat.ts";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
    const kind = KIND_SLUGS[params.kind];
    const document = await getDocument(params.id, kind);
    if (!document) error(404, "Documento non trovato");

    return { kind, document, indices: await listIstatIndices() };
};

export const actions: Actions = {
    save: async ({ request, params, locals }) => {
        const kind = KIND_SLUGS[params.kind];

        let payload: unknown;
        try {
            payload = JSON.parse(String((await request.formData()).get("payload")));
        } catch {
            return fail(400, { issues: ["Dati non validi."] });
        }

        try {
            const isUpdated = await updateDocument(locals.user!, kind, params.id, payload);
            if (!isUpdated) error(404, "Documento non trovato");
        } catch (caught) {
            if (caught instanceof DocumentValidationError) return fail(400, { issues: caught.issues });
            throw caught;
        }
        return { saved: true };
    },

    delete: async ({ params, locals }) => {
        const kind = KIND_SLUGS[params.kind];
        await deleteDocument(locals.user!, kind, params.id);
        redirect(303, "/");
    },
};
