import { fail, redirect } from "@sveltejs/kit";
import { REGISTRATION_CODE } from "$app/env/private";
import { authenticate, createSession } from "#lib/server/auth.ts";
import { recordAudit } from "#lib/server/audit.ts";
import { safeDestination } from "#lib/server/redirect.ts";
import type { Actions, PageServerLoad } from "./$types";

const LOGIN_FAILED_MESSAGE =
    "Email o password non corrette. Dopo troppi tentativi l'accesso è bloccato per qualche minuto.";

export const load: PageServerLoad = ({ locals, url }) => {
    if (locals.user) redirect(303, safeDestination(url.searchParams.get("redirectTo")));
    return { isRegistrationOpen: Boolean(REGISTRATION_CODE) };
};

export const actions: Actions = {
    default: async ({ request, cookies, url }) => {
        const form = await request.formData();
        const email = String(form.get("email") ?? "").trim();
        const password = String(form.get("password") ?? "");

        if (!email || !password) {
            return fail(400, { email, message: "Inserisci email e password." });
        }

        const result = await authenticate(email, password);

        if (result.status === "locked") {
            await recordAudit(null, { action: "auth.login-blocked", entityType: "user", details: { email } }, email);
            // Same answer as for wrong credentials: it must not reveal which accounts exist.
            return fail(400, { email, message: LOGIN_FAILED_MESSAGE });
        }
        if (result.status === "invalid-credentials") {
            await recordAudit(null, { action: "auth.login-failed", entityType: "user", details: { email } }, email);
            return fail(400, { email, message: LOGIN_FAILED_MESSAGE });
        }

        await createSession(cookies, result.user.id);
        await recordAudit(result.user, { action: "auth.login", entityType: "user", entityId: result.user.id });
        redirect(303, safeDestination(url.searchParams.get("redirectTo")));
    },
};
