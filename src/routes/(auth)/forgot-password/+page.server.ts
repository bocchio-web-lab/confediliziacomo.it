import { fail, redirect } from "@sveltejs/kit";
import { SITE_URL } from "$app/env/private";
import { isValidEmail } from "#lib/auth-rules.ts";
import { recordAudit } from "#lib/server/audit.ts";
import { createPasswordReset } from "#lib/server/auth.ts";
import { sendMail } from "#lib/server/mail.ts";
import type { Actions, PageServerLoad } from "./$types";

// Every answer takes at least this long, so that the time does not tell whether the account exists
// (the creation of the link and the sending of the email only happen when it does).
const MIN_RESPONSE_MS = 3000;

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const load: PageServerLoad = ({ locals }) => {
    if (locals.user) redirect(303, "/");
};

export const actions: Actions = {
    default: async ({ request, url }) => {
        const startedAt = Date.now();
        const email = String((await request.formData()).get("email") ?? "").trim().toLowerCase();
        if (!isValidEmail(email)) return fail(400, { email, message: "Inserisci un indirizzo email valido." });

        const reset = await createPasswordReset(email);
        if (reset) {
            const link = `${SITE_URL ?? url.origin}/reset-password/${reset.token}`;
            let isSent = false;
            try {
                isSent = await sendMail({
                    to: reset.user.email,
                    subject: "Reimposta la password - Confedilizia Como",
                    text: [
                        `Ciao ${reset.user.name},`,
                        "",
                        "abbiamo ricevuto una richiesta per reimpostare la password del tuo account.",
                        "Per sceglierne una nuova apri questo link (valido per un'ora):",
                        "",
                        link,
                        "",
                        "Se non sei stato tu, ignora questo messaggio: la tua password non cambia.",
                        "",
                        "Confedilizia Como",
                    ].join("\n"),
                });
            } catch (error) {
                console.error("Could not send the password reset email:", error);
            }
            await recordAudit(
                null,
                { action: isSent ? "auth.reset-requested" : "auth.reset-not-sent", entityType: "user", entityId: reset.user.id },
                email,
            );
        }

        // The answer is the same whether the account exists or not.
        await wait(MIN_RESPONSE_MS - (Date.now() - startedAt));
        return { sent: true, email };
    },
};
