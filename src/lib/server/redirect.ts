const DEFAULT_DESTINATION = "/";
const BASE = "http://localhost";
const LOGIN_PAGES = /^\/(login|register|forgot-password|reset-password|logout)(\/|$)/;
// Control characters (tabs and newlines are ignored by browsers when they read an address) and backslashes.
const FORBIDDEN_CHARACTERS = /[\u0000-\u001f\u007f\\]/;

/**
 * The page to open after logging in. Only paths of this site are accepted (to avoid open
 * redirects) and never the pages used to get in.
 */
export function safeDestination(value: string | null) {
    if (!value || FORBIDDEN_CHARACTERS.test(value) || !value.startsWith("/") || value.startsWith("//")) {
        return DEFAULT_DESTINATION;
    }

    // What the browser will make of the address, e.g. "/a/../login" is the login page.
    let url: URL;
    try {
        url = new URL(value, BASE);
    } catch {
        return DEFAULT_DESTINATION;
    }
    if (url.origin !== BASE || LOGIN_PAGES.test(url.pathname)) return DEFAULT_DESTINATION;

    return url.pathname + url.search + url.hash;
}
