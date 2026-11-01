import { error, redirect } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit/hooks";
import { SESSION_COOKIE, validateSession } from "#lib/server/auth.ts";

// Everything is private, except the pages used to get in and the ISTAT table the Excel workbooks read.
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/logout", "/api/istat"];

const isPublic = (pathname: string) =>
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export const handle: Handle = async ({ event, resolve }) => {
    const { pathname, search } = event.url;

    // Requests without a session cookie never reach the database.
    event.locals.user = event.cookies.get(SESSION_COOKIE) ? await validateSession(event.cookies) : null;

    if (!event.locals.user && !isPublic(pathname)) {
        if (pathname.startsWith("/api/")) error(401, "Accesso richiesto");
        redirect(303, pathname === "/" ? "/login" : `/login?redirectTo=${encodeURIComponent(pathname + search)}`);
    }

    return resolve(event);
};
