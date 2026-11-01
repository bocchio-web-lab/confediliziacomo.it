import { fail, redirect } from "@sveltejs/kit";
import { TERRITORY_SLUGS } from "#lib/accords/registry.ts";
import { KIND_LABELS, KIND_SLUGS } from "#lib/documents/types.ts";
import { DocumentValidationError, createDocument, nextDocumentNumber } from "#lib/server/documents.ts";
import { listIstatIndices } from "#lib/server/istat.ts";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
    const kind = KIND_SLUGS[params.kind];
    const territory = TERRITORY_SLUGS[params.territory];

    return {
        kind,
        territory,
        indices: await listIstatIndices(),
        nextNumber: await nextDocumentNumber(kind, territory),
    };
};

export const actions: Actions = {
    default: async ({ request, params, locals }) => {
        const kind = KIND_SLUGS[params.kind];
        const territory = TERRITORY_SLUGS[params.territory];

        let payload: unknown;
        try {
            payload = JSON.parse(String((await request.formData()).get("payload")));
        } catch {
            return fail(400, { issues: ["Dati non validi."] });
        }

        let id: string;
        try {
            id = await createDocument(locals.user!, kind, territory, payload);
        } catch (error) {
            if (error instanceof DocumentValidationError) return fail(400, { issues: error.issues });
            throw error;
        }
        redirect(303, `/${KIND_LABELS[kind].slug}/${id}?created`);
    },
};
