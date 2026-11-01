// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculate } from "./calculate.ts";
import { emptyCalculationInput } from "./input.ts";
import { COMO_2020 } from "./como-2020.ts";
import { PROVINCIA_2003 } from "./provincia-2003.ts";
import { resolveAccord } from "./registry.ts";
import type { IstatIndex } from "./types.ts";

const ISTAT: IstatIndex[] = [
    { validFrom: "2020-11-01", coefficient: 1 },
    { validFrom: "2026-09-01", coefficient: 1.227 },
    { validFrom: "2026-10-01", coefficient: 1.234 },
];

const closeTo = (actual: number | undefined, expected: number) =>
    assert.ok(actual !== undefined && Math.abs(actual - expected) < 1e-9, `${actual} !== ${expected}`);

test("Como city: surface, maximum fascia, surcharges and ISTAT", () => {
    const input = emptyCalculationInput(COMO_2020, "2026-10-05");
    input.zone = 1;
    input.floor = 2;
    input.surfaces = { net: 50, singleGarage: 15, sharedParking: 0, accessories: 8, outdoorArea: 0 };
    input.parameters = [1, 2, 3, 4, 5, 8, 12];
    input.surcharges.energyClass = "B";
    input.surcharges.duration = "5";

    const result = calculate(COMO_2020, input, ISTAT);

    assert.deepEqual(result.issues, []);
    // 50 + 15% small-unit bonus (7.5) + 70% of 15 (10.5) + 25% of 8 (2)
    closeTo(result.surface?.total, 70);
    assert.equal(result.classification?.fascia, "massima");
    assert.equal(result.rateSource, "Immobili oltre 60 mq");
    closeTo(result.totalSurchargePercent, 18);
    closeTo(result.ratePerSquareMeter?.min, 8 * 1.18 * 1.234);
    closeTo(result.ratePerSquareMeter?.max, 14.8 * 1.18 * 1.234);
    closeTo(result.monthly?.min, 8 * 1.18 * 1.234 * 70);
    closeTo(result.annual?.max, 14.8 * 1.18 * 1.234 * 70 * 12);
});

test("Como city: small units cap the conventional surface at 62 sqm", () => {
    const input = emptyCalculationInput(COMO_2020, "2026-10-05");
    input.zone = 3;
    input.surfaces.net = 60; // +15% would give 69
    const result = calculate(COMO_2020, input, ISTAT);
    closeTo(result.surface?.smallUnitBonusArea, 2);
    closeTo(result.surface?.total, 62);
});

test("Como city: microzone 2 gets +35% up to 30 sqm", () => {
    const input = emptyCalculationInput(COMO_2020, "2026-10-05");
    input.zone = 2;
    input.surfaces.net = 30;
    closeTo(calculate(COMO_2020, input, ISTAT).surface?.smallUnitBonusArea, 10.5);
    input.zone = 1;
    closeTo(calculate(COMO_2020, input, ISTAT).surface?.smallUnitBonusArea, 9);
});

test("Como city: no indoor bathroom forces the minimum fascia and max = min + 5%", () => {
    const input = emptyCalculationInput(COMO_2020, "2026-10-05");
    input.zone = 4;
    input.surfaces.net = 80;
    input.parameters = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    input.noIndoorBathroom = true;
    const result = calculate(COMO_2020, input, ISTAT);
    assert.equal(result.classification?.fascia, "minima");
    closeTo(result.ratePerSquareMeter?.max, (result.ratePerSquareMeter?.min ?? 0) * 1.05);
});

test("Como city: warns when the ISTAT index of the contract month is missing", () => {
    const input = emptyCalculationInput(COMO_2020, "2026-11-10");
    input.zone = 1;
    input.surfaces.net = 80;
    const result = calculate(COMO_2020, input, ISTAT);
    assert.equal(result.istat?.isOutdated, true);
    assert.equal(result.istat?.validFrom, "2026-10-01");
    assert.equal(result.warnings.length, 1);
});

test("Como city: reports missing data instead of a rent", () => {
    const result = calculate(COMO_2020, emptyCalculationInput(COMO_2020), ISTAT);
    assert.ok(result.issues.length >= 3);
    assert.equal(result.monthly, null);
});

test("Como city: partial lease splits the rent by exclusive surfaces", () => {
    const input = emptyCalculationInput(COMO_2020, "2026-10-05");
    input.zone = 1;
    input.surfaces.net = 100;
    input.partialLease = { tenantSurface: 20, otherTenantsSurface: 60 };
    const result = calculate(COMO_2020, input, ISTAT);
    closeTo(result.partialLease?.share, 0.25);
    closeTo(result.partialLease?.monthly.min, (result.monthly?.min ?? 0) * 0.25);
    closeTo(result.partialLease?.sharedSurface, 20);
});

test("Province: yearly table, duration and historic surcharges, no ISTAT table", () => {
    const input = emptyCalculationInput(PROVINCIA_2003, "2026-10-05");
    input.surfaces.net = 80;
    input.parameters = [1, 2, 3, 4, 6, 8];
    input.surcharges.duration = "4";
    input.surcharges.historic = true;

    const result = calculate(PROVINCIA_2003, input, []);

    assert.deepEqual(result.issues, []);
    assert.equal(result.classification?.fascia, "massima");
    assert.equal(result.istat, null);
    closeTo(result.totalSurchargePercent, 12);
    closeTo(result.ratePerSquareMeter?.min, 7.35 * 1.12);
    closeTo(result.monthly?.max, 11.1 * 1.12 * 80);
});

test("Province: the table of a year applies from October to September", () => {
    const rateOn = (date: string) => {
        const input = emptyCalculationInput(PROVINCIA_2003, date);
        input.surfaces.net = 80;
        return calculate(PROVINCIA_2003, input, []).baseRate?.min;
    };
    closeTo(rateOn("2026-09-30"), 2.77); // 2025 table
    closeTo(rateOn("2026-10-01"), 2.83); // 2026 table
    assert.equal(rateOn("2027-10-01"), undefined); // 2027 table not available yet
});

test("Province: the 'up to 15%' surcharges are capped and need a small unit", () => {
    const input = emptyCalculationInput(PROVINCIA_2003, "2026-10-05");
    input.surfaces.net = 54;
    input.surcharges.smallUnit = 40;
    input.surcharges.furnished = 10;
    assert.equal(calculate(PROVINCIA_2003, input, []).totalSurchargePercent, 25);

    input.surfaces.net = 56;
    assert.equal(calculate(PROVINCIA_2003, input, []).totalSurchargePercent, 10);
});

test("Accords are selected by contract date", () => {
    assert.equal(resolveAccord("city", "2026-01-01")?.id, "como-2020");
    assert.equal(resolveAccord("city", "2020-10-05"), null);
    assert.equal(resolveAccord("province", "2003-09-02")?.id, "provincia-2003");
    assert.equal(resolveAccord("province", "2003-09-01"), null);
});

test("A lower fascia can be chosen, a higher one cannot", () => {
    const build = (override: "media" | "minima" | null, parameters: number[]) => {
        const input = emptyCalculationInput(COMO_2020, "2026-10-05");
        input.zone = 1;
        input.floor = 2;
        input.surfaces.net = 80;
        input.parameters = parameters;
        input.fasciaOverride = override;
        return calculate(COMO_2020, input, ISTAT).classification;
    };

    // 5 of the first 7 and one of the others is the maximum fascia for 60-100 sqm up to the 3rd floor.
    const maximum = [1, 2, 3, 4, 5, 8];
    assert.equal(build(null, maximum)?.fascia, "massima");
    assert.equal(build("media", maximum)?.fascia, "media");
    assert.equal(build("media", maximum)?.automaticFascia, "massima");
    assert.equal(build("minima", maximum)?.fascia, "minima");

    // Choosing a higher fascia than the one the parameters give changes nothing.
    assert.equal(build("media", [1, 2])?.fascia, "minima");
});

test("Messages name the date the way the document calls it", () => {
    const input = emptyCalculationInput(COMO_2020);
    assert.ok(calculate(COMO_2020, input, ISTAT, "data del prospetto").issues[0].includes("data del prospetto"));
    assert.ok(calculate(COMO_2020, input, ISTAT).issues[0].includes("data di stipula del contratto"));
});
