import { redirect } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit/hooks";
import { SESSION_COOKIE, validateSession } from "#lib/server/auth.ts";

const PRIVATE_AREA = "/app";
const PUBLIC_APP_PATHS = new Set(["/app/login", "/app/logout"]);

export const handle: Handle = async ({ event, resolve }) => {
    const { pathname } = event.url;
    const isPrivateArea = pathname === PRIVATE_AREA || pathname.startsWith(`${PRIVATE_AREA}/`);

    // Prerendered public pages have no cookies, so they never reach the database.
    event.locals.user =
        isPrivateArea && event.cookies.get(SESSION_COOKIE)
            ? await validateSession(event.cookies)
            : null;

    if (isPrivateArea && !PUBLIC_APP_PATHS.has(pathname) && !event.locals.user) {
        redirect(303, `/app/login?redirectTo=${encodeURIComponent(pathname + event.url.search)}`);
    }

    return resolve(event);
};
