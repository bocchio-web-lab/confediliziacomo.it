import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = ({ locals }) => ({
    // The hook already redirects anonymous visitors, so a user is always present here.
    user: locals.user!,
});
