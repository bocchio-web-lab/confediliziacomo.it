import signatureDataUrl from "#lib/server/assets/firma-timbro.png?inline";
import type { RequestHandler } from "./$types";

const PNG_BYTES = Buffer.from(signatureDataUrl.slice(signatureDataUrl.indexOf(",") + 1), "base64");

/**
 * Signature and stamp of the association, printed on the prospectuses.
 * Only logged-in users can get it (see hooks.server.ts): it is not a public file.
 */
export const GET: RequestHandler = () =>
    new Response(PNG_BYTES, {
        headers: { "content-type": "image/png", "cache-control": "private, max-age=3600" },
    });
