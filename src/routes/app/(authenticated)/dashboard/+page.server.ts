import { listRecentAudit } from "#lib/server/audit.ts";
import { countDocuments, listRecentDocuments } from "#lib/server/documents.ts";
import { listIstatIndices } from "#lib/server/istat.ts";
import { todayIso } from "#lib/format.ts";
import { findIstatIndex } from "#lib/accords/calculate.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    const [counts, recentDocuments, recentActivity, indices] = await Promise.all([
        countDocuments(),
        listRecentDocuments(),
        listRecentAudit(8),
        listIstatIndices(),
    ]);

    const today = todayIso();
    const currentIndex = findIstatIndex(indices, today);

    return {
        counts,
        recentDocuments,
        recentActivity,
        istat: {
            latest: indices.at(-1) ?? null,
            // The index of the current month is missing when the latest row starts in an earlier month.
            isCurrentMonthMissing: !currentIndex || currentIndex.validFrom.slice(0, 7) < today.slice(0, 7),
        },
    };
};
