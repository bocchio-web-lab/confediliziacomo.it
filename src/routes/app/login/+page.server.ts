import { fail, redirect } from "@sveltejs/kit";
import { authenticate, createSession } from "#lib/server/auth.ts";
import { recordAudit } from "#lib/server/audit.ts";
import type { Actions, PageServerLoad } from "./$types";

const DEFAULT_DESTINATION = "/app/dashboard";

/** Only paths inside the private area are accepted, to avoid open redirects. */
const safeDestination = (value: string | null) =>
    value && value.startsWith("/app/") && !value.startsWith("//") ? value : DEFAULT_DESTINATION;

export const load: PageServerLoad = ({ locals, url }) => {
    if (locals.user) redirect(303, safeDestination(url.searchParams.get("redirectTo")));
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
            return fail(429, {
                email,
                message: "Troppi tentativi falliti. Riprova tra qualche minuto.",
            });
        }
        if (result.status === "invalid-credentials") {
            await recordAudit(null, { action: "auth.login-failed", entityType: "user", details: { email } }, email);
            return fail(400, { email, message: "Email o password non corrette." });
        }

        await createSession(cookies, result.user.id);
        await recordAudit(result.user, { action: "auth.login", entityType: "user", entityId: result.user.id });
        redirect(303, safeDestination(url.searchParams.get("redirectTo")));
    },
};
