import { fail, redirect } from "@sveltejs/kit";
import { MIN_PASSWORD_LENGTH } from "#lib/auth-rules.ts";
import { recordAudit } from "#lib/server/audit.ts";
import { completePasswordReset, createSession, isPasswordResetTokenValid } from "#lib/server/auth.ts";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => ({
    isTokenValid: await isPasswordResetTokenValid(params.token),
});

export const actions: Actions = {
    default: async ({ request, params, cookies }) => {
        const form = await request.formData();
        const password = String(form.get("password") ?? "");
        const passwordConfirmation = String(form.get("passwordConfirmation") ?? "");

        if (password.length < MIN_PASSWORD_LENGTH) {
            return fail(400, { message: `La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri.` });
        }
        if (password !== passwordConfirmation) return fail(400, { message: "Le due password non coincidono." });

        const user = await completePasswordReset(params.token, password);
        if (!user) return fail(400, { isExpired: true, message: "Il link non è valido o è scaduto." });

        // Every other session was closed: this one starts fresh.
        await createSession(cookies, user.id);
        await recordAudit(user, { action: "auth.password-reset", entityType: "user", entityId: user.id });
        redirect(303, "/");
    },
};
