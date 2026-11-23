// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { COMO_2020 } from "#lib/accords/como-2020.ts";
import { emptyCalculationInput } from "#lib/accords/input.ts";
import { PROVINCIA_2003 } from "#lib/accords/provincia-2003.ts";
import { buildDocumentPdf } from "#lib/pdf/build-document.ts";
import { calculateDocument } from "./calculation.ts";
import { emptyDocumentDetails, type DocumentData, type DocumentKind } from "./types.ts";

const INDICES = [{ validFrom: "2020-11-01", coefficient: 1.2 }];

/** A document that has every parameter, so that the fascia of the parameters is the highest one. */
const document = (accord: typeof COMO_2020 | typeof PROVINCIA_2003, fasciaOverride: "media" | "minima" | null): DocumentData => {
    const calculation = emptyCalculationInput(accord, "2026-10-05");
    calculation.floor = 1;
    calculation.surfaces.net = 70;
    if (accord.zones.length > 0) calculation.zone = 2;
    calculation.parameters = [...accord.coreParameters, ...accord.extraParameters].map((parameter) => parameter.number);
    calculation.fasciaOverride = fasciaOverride;
    return {
        calculation,
        details: { ...emptyDocumentDetails(), fasciaNotes: "Immobile in normale stato di manutenzione." },
        requestedNumber: null,
    };
};

const textOf = (accord: typeof COMO_2020 | typeof PROVINCIA_2003, data: DocumentData, kind: DocumentKind) => {
    const result = calculateDocument(accord, data, kind, INDICES);
    assert.deepEqual(result.issues, []);
    const definition = buildDocumentPdf({ kind, accord, data, result, documentNumber: 1, logo: "data:,", signature: null });
    const texts: string[] = [];
    JSON.stringify(definition.content, (_, value) => {
        if (typeof value === "string") texts.push(value);
        return value;
    });
    return { text: texts.join("\n"), result };
};

for (const accord of [COMO_2020, PROVINCIA_2003]) {
    for (const kind of ["prospectus", "attestation"] as const) {
        test(`The fascia can be lowered, with its notes, in a ${kind} of the ${accord.territoryLabel}`, () => {
            const automatic = textOf(accord, document(accord, null), kind);
            assert.equal(automatic.result.classification?.fascia, "massima");
            assert.doesNotMatch(automatic.text, /ridotta per lo stato dell'immobile/);

            const lowered = textOf(accord, document(accord, "media"), kind);
            assert.equal(lowered.result.classification?.fascia, "media");
            assert.equal(lowered.result.classification?.automaticFascia, "massima");
            assert.ok(lowered.result.monthly!.max < automatic.result.monthly!.max, "the rent follows the lower fascia");
            assert.match(lowered.text, /MEDIA/);
            assert.match(lowered.text, /fascia massima in base ai parametri, ridotta per lo stato dell'immobile/);
            // "Note:" and the notes are two pieces of text of the PDF.
            assert.match(lowered.text, /Note: \s*Immobile in normale stato di manutenzione\./);
        });
    }
}
