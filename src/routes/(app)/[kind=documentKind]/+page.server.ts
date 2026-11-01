import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

// The list of documents is the home page: this address keeps old links working.
export const load: PageServerLoad = ({ params }) => redirect(307, `/?tipo=${params.kind}`);
