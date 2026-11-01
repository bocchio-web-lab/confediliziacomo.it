import { formatIstatFeed } from "#lib/istat-feed.ts";
import { listIstatIndices } from "#lib/server/istat.ts";
import type { RequestHandler } from "./$types";

/**
 * The ISTAT indices as plain text, for the Excel workbooks still in use. They ask the old server,
 * which asks this address (see legacy/altervista-api). Public, like the old one: it only holds
 * the coefficients, no personal data.
 */
export const GET: RequestHandler = async () =>
    new Response(formatIstatFeed(await listIstatIndices()), {
        headers: {
            "content-type": "text/plain; charset=utf-8",
            // A new index must reach the workbooks soon, but they do not need it second by second.
            "cache-control": "public, max-age=60",
        },
    });
