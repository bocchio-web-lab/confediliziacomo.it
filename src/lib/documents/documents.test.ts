// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { COMO_2020 } from "#lib/accords/como-2020.ts";
import { safeDestination } from "#lib/server/redirect.ts";
import { buildSearchText, normalizeForSearch, searchTerms } from "./search.ts";
import { documentLabel, emptyDocumentDetails, sanitizeDocumentData } from "./types.ts";
import { numberingYear, sequenceKey } from "./numbering.ts";

test("The person comes first in the label, the address follows in brackets", () => {
    assert.deepEqual(documentLabel({ applicantName: "Mario Rossi", address: "Via Roma 1" }), {
        primary: "Mario Rossi",
        secondary: "Via Roma 1",
    });
    assert.deepEqual(documentLabel({ applicantName: "", address: "Via Roma 1" }), {
        primary: "Via Roma 1",
        secondary: "",
    });
    assert.equal(documentLabel({ applicantName: "", address: "" }).primary, "Senza nome né indirizzo");
});

test("Search ignores case and accents and needs every word", () => {
    assert.equal(normalizeForSearch("Cantù, Città"), "cantu, citta");
    assert.deepEqual(searchTerms("  Rossi   VIA roma "), ["rossi", "via", "roma"]);

    const data = sanitizeDocumentData(
        {
            details: {
                landlord: { name: "Mario Rossi" },
                tenant: { name: "Anna Bianchi" },
                address: "Via Cantù 3, Como",
            },
        },
        COMO_2020,
    );
    const text = buildSearchText(data, 42);
    for (const term of searchTerms("rossi cantu bianchi 42")) assert.ok(text.includes(term), term);
    assert.ok(!text.includes("verdi"));
});

test("Documents made before the new fields existed are completed with defaults", () => {
    const data = sanitizeDocumentData({ details: { number: "7", address: "  Via Roma 1  " } }, COMO_2020);
    assert.equal(data.details.address, "Via Roma 1");
    assert.equal(data.details.showSignature, true);
    assert.equal(data.details.fasciaNotes, "");
    assert.equal(data.requestedNumber, null);
    assert.equal(data.calculation.fasciaOverride, null);
    assert.deepEqual(Object.keys(data.details).sort(), Object.keys(emptyDocumentDetails()).sort());
});

test("The requested number must be a positive whole number", () => {
    const requested = (value: unknown) => sanitizeDocumentData({ requestedNumber: value }, COMO_2020).requestedNumber;
    assert.equal(requested(12), 12);
    assert.equal(requested("12"), 12);
    for (const invalid of [0, -3, 1.5, "abc", null, undefined]) assert.equal(requested(invalid), null);
});

test("Every combination of kind, territory and year has its own sequence", () => {
    const keys = [
        sequenceKey("prospectus", "city", 2026),
        sequenceKey("prospectus", "province", 2026),
        sequenceKey("attestation", "city", 2026),
        sequenceKey("attestation", "province", 2026),
        sequenceKey("prospectus", "city", 2027),
    ];
    assert.equal(new Set(keys).size, 5);
});

test("A document is numbered in the Italian year of its creation", () => {
    assert.equal(numberingYear(new Date("2026-06-15T10:00:00Z")), 2026);
    // Italy is one hour ahead of Greenwich in winter: 23:30 UTC on 31 December is already the next year there.
    assert.equal(numberingYear(new Date("2026-12-31T22:30:00Z")), 2026);
    assert.equal(numberingYear(new Date("2026-12-31T23:30:00Z")), 2027);
});

test("After the login only paths of this site are opened", () => {
    assert.equal(safeDestination("/prospetti/abc"), "/prospetti/abc");
    assert.equal(safeDestination("/?q=rossi"), "/?q=rossi");
    const unsafe = [
        null,
        "",
        "https://evil.example",
        "//evil.example",
        "/\\evil.example",
        "/login",
        "/register?x=1",
        "/logout",
        // Browsers ignore tabs and newlines in addresses: "/<tab>/evil.example" would become "//evil.example".
        "/\t/evil.example",
        "/\n/evil.example",
        // Dots are resolved by the browser.
        "/a/../login",
        "/./login",
    ];
    for (const value of unsafe) assert.equal(safeDestination(value), "/", JSON.stringify(value));
});

test("The ISTAT feed keeps the format the Excel workbooks expect", async () => {
    const { formatIstatFeed } = await import("#lib/istat-feed.ts");
    const feed = formatIstatFeed([
        { validFrom: "2023-10-07", coefficient: 1.168 },
        { validFrom: "2020-11-01", coefficient: 1 },
        { validFrom: "2026-10-01", coefficient: 1.234 },
    ]);
    assert.equal(feed, "2020-11-01;1\n2023-10-07;1.168\n2026-10-01;1.234\n");
    // Each line has exactly one semicolon: the macro skips the others.
    for (const line of feed.trim().split("\n")) assert.equal(line.split(";").length, 2);
    assert.equal(formatIstatFeed([]), "");
});
