import { redirect } from "@sveltejs/kit";
import { destroySession } from "#lib/server/auth.ts";
import { recordAudit } from "#lib/server/audit.ts";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ cookies, locals }) => {
    if (locals.user) await recordAudit(locals.user, { action: "auth.logout", entityType: "user", entityId: locals.user.id });
    await destroySession(cookies);
    redirect(303, "/login");
};
