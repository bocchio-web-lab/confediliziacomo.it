// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { COMO_2020 } from "#lib/accords/como-2020.ts";
import { emptyCalculationInput } from "#lib/accords/input.ts";
import { PROVINCIA_2003 } from "#lib/accords/provincia-2003.ts";
import { buildDocumentPdf } from "#lib/pdf/build-document.ts";
import { calculateDocument } from "./calculation.ts";
import { buildSearchText } from "./search.ts";
import {
    MAX_ADDITIONAL_PARTIES,
    emptyDocumentDetails,
    emptyParty,
    landlordsOf,
    sanitizeDocumentData,
    tenantsOf,
    type DocumentData,
    type Party,
} from "./types.ts";

const person = (name: string, extra: Partial<Party> = {}): Party => ({ ...emptyParty(), name, ...extra });

const data = (accord: typeof COMO_2020 | typeof PROVINCIA_2003, details: Partial<DocumentData["details"]>): DocumentData => {
    const calculation = emptyCalculationInput(accord, "2026-10-05");
    calculation.floor = 1;
    calculation.surfaces.net = 70;
    if (accord.zones.length > 0) calculation.zone = 2;
    return { calculation, details: { ...emptyDocumentDetails(), ...details }, requestedNumber: null };
};

const premiseOf = (document: DocumentData, accord: typeof COMO_2020 | typeof PROVINCIA_2003) => {
    const result = calculateDocument(accord, document, "attestation", [{ validFrom: "2020-11-01", coefficient: 1.2 }]);
    assert.deepEqual(result.issues, []);
    const definition = buildDocumentPdf({ kind: "attestation", accord, data: document, result, documentNumber: 1, logo: "data:,", signature: null });
    const texts: string[] = [];
    JSON.stringify(definition.content, (_, value) => {
        if (typeof value === "string") texts.push(value);
        return value;
    });
    return texts.join("\n");
};

test("Other landlords and tenants are kept, without the blank ones, and not too many", () => {
    const sanitized = sanitizeDocumentData(
        {
            details: {
                additionalLandlords: [{ name: "Anna Verdi" }, {}, { name: " " }, { taxCode: "VRDNNA70A41C933X" }],
                additionalTenants: Array.from({ length: 20 }, (_, index) => ({ name: `Conduttore ${index}` })),
            },
        },
        COMO_2020,
    ).details;
    assert.deepEqual(
        sanitized.additionalLandlords.map((party) => [party.name, party.taxCode]),
        [["Anna Verdi", ""], ["", "VRDNNA70A41C933X"]],
    );
    assert.equal(sanitized.additionalTenants.length, MAX_ADDITIONAL_PARTIES);

    // Documents saved before there were other parties have none.
    assert.deepEqual(sanitizeDocumentData({ details: { landlord: { name: "Mario" } } }, COMO_2020).details.additionalLandlords, []);
    // Not a list: no parties.
    assert.deepEqual(sanitizeDocumentData({ details: { additionalTenants: "Anna" } }, COMO_2020).details.additionalTenants, []);
});

test("The first landlord and tenant always count, the others only when filled in", () => {
    const details = { ...emptyDocumentDetails(), additionalLandlords: [person("B"), emptyParty()], additionalTenants: [emptyParty()] };
    assert.equal(landlordsOf(details).length, 2);
    assert.equal(tenantsOf(details).length, 1);
    assert.equal(tenantsOf(details)[0].name, "");
});

test("All the people are found by the search", () => {
    const document = data(COMO_2020, {
        landlord: person("Mario Rossi"),
        additionalLandlords: [person("Giulia Neri")],
        tenant: person("Anna Bianchi"),
        additionalTenants: [person("Luca Gialli")],
        address: "Via Roma 1",
    });
    const text = buildSearchText(document, 7);
    for (const word of ["rossi", "neri", "bianchi", "gialli", "via roma 1", "7"]) assert.ok(text.includes(word), word);
});

test("The premise of the attestation of the Comune names every party, and is unchanged with one", () => {
    const single = premiseOf(
        data(COMO_2020, { landlord: person("Mario Rossi", { taxCode: "AAA", residence: "Como" }), tenant: person("Anna Bianchi", { taxCode: "BBB", residence: "Lecco" }) }),
        COMO_2020,
    );
    assert.match(single, /il Sig\. Mario Rossi C\.F\.: AAA residente in Como nella qualità di locatore dell'immobile/);
    assert.match(single, /in forza di contratto stipulato con il Sig\. Anna Bianchi C\.F\.: BBB, residente in Lecco il /);

    const several = premiseOf(
        data(COMO_2020, {
            landlord: person("Mario Rossi", { taxCode: "AAA", residence: "Como" }),
            additionalLandlords: [person("Giulia Neri", { taxCode: "CCC", residence: "Cantù" })],
            tenant: person("Anna Bianchi", { taxCode: "BBB", residence: "Lecco" }),
            additionalTenants: [person("Luca Gialli", { taxCode: "DDD", residence: "Erba" })],
        }),
        COMO_2020,
    );
    assert.match(several, /i Sigg\. Mario Rossi C\.F\.: AAA residente in Como; Giulia Neri C\.F\.: CCC residente in Cantù nella qualità di locatori dell'immobile/);
    assert.match(several, /stipulato con i Sigg\. Anna Bianchi C\.F\.: BBB, residente in Lecco; Luca Gialli C\.F\.: DDD, residente in Erba il /);
});

test("The attestation of the Provincia names every party", () => {
    const several = premiseOf(
        data(PROVINCIA_2003, {
            landlord: person("Mario Rossi"),
            additionalLandlords: [person("Giulia Neri", { birthPlace: "Como", birthDate: "1971-02-03" })],
            tenant: person("Anna Bianchi"),
        }),
        PROVINCIA_2003,
    );
    assert.match(several, /tra i Sigg\. Mario Rossi nato a …+ il …+ residente a …+ C\.F\. …+; Giulia Neri nato a Como il 03\/02\/1971 residente a …+ C\.F\. …+ in qualità di locatori e il Sig\. Anna Bianchi .* in qualità di conduttore,/);
});
