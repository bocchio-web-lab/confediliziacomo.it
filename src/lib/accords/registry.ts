import { COMO_2020 } from "./como-2020.ts";
import { PROVINCIA_2003 } from "./provincia-2003.ts";
import type { AccordDefinition, Territory } from "./types.ts";

/**
 * Every accord the application knows about. When a new accord is signed, add its
 * definition here: contracts are matched to the accord in force on their signing date.
 */
export const ACCORDS: readonly AccordDefinition[] = [COMO_2020, PROVINCIA_2003];

export const TERRITORY_LABELS: Record<Territory, string> = {
    city: "Comune di Como",
    province: "Provincia di Como",
};

/** Slugs used in the URLs of the private area. */
export const TERRITORY_SLUGS: Record<string, Territory> = {
    "comune-di-como": "city",
    "provincia-di-como": "province",
};

export const slugOfTerritory = (territory: Territory) =>
    Object.entries(TERRITORY_SLUGS).find(([, value]) => value === territory)![0];

const accordsOf = (territory: Territory) =>
    ACCORDS.filter((accord) => accord.territory === territory).sort((a, b) =>
        a.validFrom.localeCompare(b.validFrom),
    );

export const accordById = (id: string) => ACCORDS.find((accord) => accord.id === id) ?? null;

/** The accord in force on `contractDate`, or null if the date precedes every accord. */
export function resolveAccord(territory: Territory, contractDate: string): AccordDefinition | null {
    const candidates = accordsOf(territory).filter((accord) => accord.validFrom <= contractDate);
    return candidates.at(-1) ?? null;
}

/**
 * The accord to use to build a form: the one in force on the date, or the latest one
 * while the date is missing or too old (the calculation then reports the problem).
 */
export function accordForForm(territory: Territory, contractDate: string): AccordDefinition {
    return resolveAccord(territory, contractDate) ?? accordsOf(territory).at(-1)!;
}
