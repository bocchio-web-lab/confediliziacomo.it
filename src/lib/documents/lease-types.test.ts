// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { COMO_2020 } from "#lib/accords/como-2020.ts";
import { emptyCalculationInput } from "#lib/accords/input.ts";
import { PROVINCIA_2003 } from "#lib/accords/provincia-2003.ts";
import { buildDocumentPdf, type PdfInput } from "#lib/pdf/build-document.ts";
import { calculateDocument } from "./calculation.ts";
import { LEASE_TYPES, emptyDocumentDetails, leaseTypeOf, sanitizeDocumentData, type DocumentData, type LeaseType } from "./types.ts";

const provinceDocument = (leaseType: LeaseType, withSurface = true): DocumentData => {
    const calculation = emptyCalculationInput(PROVINCIA_2003, "2026-10-05");
    calculation.floor = 2;
    if (withSurface) calculation.surfaces.net = 70;
    return {
        calculation,
        details: {
            ...emptyDocumentDetails(),
            leaseType,
            address: "Via Roma 1, Cantù",
            issueDate: "2026-10-06",
            agreedAnnualRent: 6000,
            leaseStartDate: "2026-10-01",
            landlord: { name: "Mario Rossi", taxCode: "RSSMRA70A01C933X", residence: "Cantù 22063 Via Dante 2", birthPlace: "Como", birthDate: "1970-01-01" },
            tenant: { name: "Anna Bianchi", taxCode: "", residence: "", birthPlace: "", birthDate: "" },
        },
        requestedNumber: null,
    };
};

/** All the text of a PDF definition, in one string. */
const textOf = (data: DocumentData, accord = PROVINCIA_2003, kind: PdfInput["kind"] = "attestation") => {
    const result = calculateDocument(accord, data, kind, [{ validFrom: "2020-11-01", coefficient: 1.2 }]);
    assert.deepEqual(result.issues, []);
    const definition = buildDocumentPdf({ kind, accord, data, result, documentNumber: 7, logo: "data:,", signature: null });
    const texts: string[] = [];
    JSON.stringify(definition.content, (_, value) => {
        if (typeof value === "string") texts.push(value);
        return value;
    });
    return texts.join("\n");
};

test("Only the attestations of the Provincia have a kind of lease", () => {
    const details = { leaseType: "transitory" } as const;
    assert.equal(leaseTypeOf("attestation", "province", details), "transitory");
    assert.equal(leaseTypeOf("attestation", "city", details), "agreed");
    assert.equal(leaseTypeOf("prospectus", "province", details), "agreed");
});

test("The kind of lease and the birth data are cleaned like the rest", () => {
    const sanitize = (details: unknown) => sanitizeDocumentData({ details }, PROVINCIA_2003).details;
    assert.equal(sanitize({}).leaseType, "agreed");
    assert.equal(sanitize({ leaseType: "student" }).leaseType, "student");
    assert.equal(sanitize({ leaseType: "transitory" }).leaseType, "transitory");
    assert.equal(sanitize({ leaseType: "something else" }).leaseType, "agreed");

    const landlord = sanitize({ landlord: { birthPlace: " Como ", birthDate: "1970-01-01" } }).landlord;
    assert.equal(landlord.birthPlace, "Como");
    assert.equal(landlord.birthDate, "1970-01-01");
    assert.equal(sanitize({ landlord: { birthDate: "ieri" } }).landlord.birthDate, "");
});

test("A transitory lease has nothing to calculate, the others do", () => {
    const transitory = calculateDocument(PROVINCIA_2003, provinceDocument("transitory", false), "attestation", []);
    assert.deepEqual(transitory.issues, []);
    assert.equal(transitory.monthly, null);

    // Without the surface the agreed lease cannot be calculated.
    const agreed = calculateDocument(PROVINCIA_2003, provinceDocument("agreed", false), "attestation", []);
    assert.ok(agreed.issues.length > 0);
    const student = calculateDocument(PROVINCIA_2003, provinceDocument("student"), "attestation", []);
    assert.ok(student.monthly && student.monthly.min > 0);
    assert.equal(student.monthly.min, calculateDocument(PROVINCIA_2003, provinceDocument("agreed"), "attestation", []).monthly!.min);

    // The date still decides the accord, even without a calculation.
    const data = provinceDocument("transitory", false);
    data.calculation.contractDate = "1999-01-01";
    assert.ok(calculateDocument(PROVINCIA_2003, data, "attestation", []).issues.length > 0);
});

test("The kind of lease is ignored where it does not apply", () => {
    const data = provinceDocument("transitory", false);
    data.calculation = emptyCalculationInput(COMO_2020, "2026-10-05");
    // An attestation of the Comune always calculates: it has no surface here, so there is something to complete.
    assert.ok(calculateDocument(COMO_2020, data, "attestation", []).issues.length > 0);
});

test("The attestation of the Provincia follows the form of the association for each kind of lease", () => {
    const agreed = textOf(provinceDocument("agreed"));
    assert.match(agreed, /COMUNI DELLA PROVINCIA DI COMO/);
    assert.match(agreed, new RegExp(LEASE_TYPES.agreed.heading.replace("+", "\\+")));
    assert.match(agreed, /ai sensi dell'art\. 2, comma 3, L\. 431\/1998 con canone annuo di .*6\.000,00/);
    assert.match(agreed, /il Sig\. Mario Rossi nato a Como il 01\/01\/1970 residente a Cantù 22063 Via Dante 2 C\.F\. RSSMRA70A01C933X in qualità di locatore/);
    assert.match(agreed, /il Sig\. Anna Bianchi nato a …+ il …+ residente a …+ C\.F\. …+ in qualità di conduttore/);
    assert.match(agreed, /dipendente delegato Sig\. Ghisoni Sergio Antonio/);
    assert.match(agreed, /contenuti economici e normativi .* stipulato in data 02\.09\.2003 in forza del D\.M\. 30\.12\.2002/);
    assert.match(agreed, /Si allega alla presente il prospetto di conteggio del canone/);
    assert.match(agreed, /PROSPETTO DI CONTEGGIO DEL CANONE/);

    const student = textOf(provinceDocument("student"));
    assert.match(student, /CONTRATTI DI LOCAZIONE UNIVERSITARI/);
    assert.match(student, /per studenti universitari stipulato ai sensi dell'art\. 5, comma 2, L\. 431\/1998/);
    assert.match(student, /PROSPETTO DI CONTEGGIO DEL CANONE/);

    const transitory = textOf(provinceDocument("transitory", false));
    assert.match(transitory, /CONTRATTI DI LOCAZIONE TRANSITORI/);
    assert.match(transitory, /transitorio stipulato ai sensi dell'art\. 5, comma 1, L\. 431\/1998/);
    assert.match(transitory, /contenuti normativi .*Tale Accordo Territoriale prevede che le parti possano determinare liberamente la misura del canone/);
    assert.doesNotMatch(transitory, /contenuti economici/);
    assert.doesNotMatch(transitory, /Si allega|PROSPETTO DI CONTEGGIO/);
});

test("The attestation of the Comune keeps its own form", () => {
    const data = provinceDocument("agreed");
    data.calculation = emptyCalculationInput(COMO_2020, "2026-10-05");
    data.calculation.zone = 2;
    data.calculation.surfaces.net = 70;
    data.calculation.floor = 1;
    const text = textOf(data, COMO_2020);
    assert.match(text, /ATTESTAZIONE DI RISPONDENZA EX D\.M\. 16\/1\/2017/);
    assert.doesNotMatch(text, /COMUNI DELLA PROVINCIA DI COMO/);
});
