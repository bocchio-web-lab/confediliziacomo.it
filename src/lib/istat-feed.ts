import type { IstatIndex } from "#lib/accords/types.ts";

/**
 * The ISTAT table in the format the old server used to give to the Excel workbooks: one line
 * "YYYY-MM-DD;coefficient" for each index, oldest first, every line ended by "\n", the decimal
 * separator is a dot. The workbooks read it with a fixed format: do not change it.
 */
export function formatIstatFeed(indices: readonly IstatIndex[]) {
    return [...indices]
        .sort((a, b) => a.validFrom.localeCompare(b.validFrom))
        .map((index) => `${index.validFrom};${index.coefficient}\n`)
        .join("");
}
