import { fail } from "@sveltejs/kit";
import { isValidIsoDate } from "#lib/accords/calculate.ts";
import { deleteIstatIndex, listIstatIndexRows, saveIstatIndex } from "#lib/server/istat.ts";
import type { Actions, PageServerLoad } from "./$types";

const MIN_COEFFICIENT = 0.5;
const MAX_COEFFICIENT = 5;

export const load: PageServerLoad = async () => ({ indices: await listIstatIndexRows() });

export const actions: Actions = {
    save: async ({ request, locals }) => {
        const form = await request.formData();
        const validFrom = String(form.get("validFrom") ?? "");
        const coefficient = Number(String(form.get("coefficient") ?? "").replace(",", "."));

        if (!isValidIsoDate(validFrom)) {
            return fail(400, { validFrom, coefficient: String(form.get("coefficient")), message: "Inserisci una data valida." });
        }
        if (!Number.isFinite(coefficient) || coefficient < MIN_COEFFICIENT || coefficient > MAX_COEFFICIENT) {
            return fail(400, {
                validFrom,
                coefficient: String(form.get("coefficient")),
                message: `Il coefficiente deve essere compreso tra ${MIN_COEFFICIENT} e ${MAX_COEFFICIENT}.`,
            });
        }

        await saveIstatIndex(locals.user!, validFrom, Math.round(coefficient * 10000) / 10000);
        return { saved: validFrom };
    },

    delete: async ({ request, locals }) => {
        const validFrom = String((await request.formData()).get("validFrom") ?? "");
        if (!isValidIsoDate(validFrom)) return fail(400, { message: "Data non valida." });

        await deleteIstatIndex(locals.user!, validFrom);
        return { deleted: validFrom };
    },
};
