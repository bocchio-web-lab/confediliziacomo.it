import { createHash, timingSafeEqual } from "node:crypto";
import { error, fail, redirect } from "@sveltejs/kit";
import { REGISTRATION_CODE } from "$app/env/private";
import { MIN_PASSWORD_LENGTH, isValidEmail } from "#lib/auth-rules.ts";
import { recordAudit } from "#lib/server/audit.ts";
import { createSession, registerUser } from "#lib/server/auth.ts";
import { sql } from "#lib/server/db.ts";
import type { Actions, PageServerLoad } from "./$types";

const MAX_FAILED_CODES = 10;
const FAILED_CODES_WINDOW_MINUTES = 15;

const sha256 = (value: string) => createHash("sha256").update(value).digest();

const isCodeCorrect = (attempt: string, code: string) => timingSafeEqual(sha256(attempt.trim()), sha256(code));

export const load: PageServerLoad = ({ locals }) => {
    if (locals.user) redirect(303, "/");
    // Without a registration code nobody can sign up.
    if (!REGISTRATION_CODE) error(404, "Registrazione non disponibile");
};

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        if (!REGISTRATION_CODE) error(404, "Registrazione non disponibile");

        const form = await request.formData();
        const name = String(form.get("name") ?? "").trim();
        const email = String(form.get("email") ?? "").trim().toLowerCase();
        const password = String(form.get("password") ?? "");
        const passwordConfirmation = String(form.get("passwordConfirmation") ?? "");
        const code = String(form.get("code") ?? "");
        const values = { name, email };

        // Wrong codes are counted across all visitors: guessing the code must not be possible.
        const [{ failures }] = await sql<{ failures: number }[]>`
            select count(*)::int as failures from audit_log
            where action = 'auth.register-failed'
              and created_at > now() - make_interval(mins => ${FAILED_CODES_WINDOW_MINUTES})
        `;
        if (failures >= MAX_FAILED_CODES) {
            return fail(429, { values, errors: { code: "Troppi tentativi. Riprova tra qualche minuto." } });
        }
        if (!isCodeCorrect(code, REGISTRATION_CODE)) {
            await recordAudit(null, { action: "auth.register-failed", entityType: "user", details: { email } }, email);
            return fail(400, { values, errors: { code: "Il codice di registrazione non è corretto." } });
        }

        const errors: Record<string, string> = {};
        if (name.length < 2) errors.name = "Inserisci nome e cognome.";
        if (!isValidEmail(email)) errors.email = "Inserisci un indirizzo email valido.";
        if (password.length < MIN_PASSWORD_LENGTH) {
            errors.password = `La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri.`;
        } else if (password !== passwordConfirmation) {
            errors.passwordConfirmation = "Le due password non coincidono.";
        }
        if (Object.keys(errors).length > 0) return fail(400, { values, errors });

        const user = await registerUser({ name, email, password });
        if (!user) return fail(400, { values, errors: { email: "Esiste già un account con questa email." } });

        await createSession(cookies, user.id);
        await recordAudit(user, { action: "auth.register", entityType: "user", entityId: user.id });
        redirect(303, "/");
    },
};
