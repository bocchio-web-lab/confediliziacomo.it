import { accordById, accordForForm } from "#lib/accords/registry.ts";
import type { IstatIndex } from "#lib/accords/types.ts";
import { calculateDocument } from "#lib/documents/calculation.ts";
import type { StoredDocument } from "#lib/documents/types.ts";
import { downloadDocumentPdf } from "./download-pdf.ts";

/**
 * Downloads the PDF of a saved document without opening it: the data is fetched and the
 * result recalculated with the ISTAT indices in force now, as when the document is opened.
 */
export async function downloadStoredDocumentPdf(id: string) {
    const response = await fetch(`/api/documents/${id}`);
    if (!response.ok) throw new Error(`Documento non disponibile (${response.status})`);

    const { document, indices } = (await response.json()) as { document: StoredDocument; indices: IstatIndex[] };
    const accord = accordById(document.accordId) ?? accordForForm(document.territory, document.contractDate);
    const result = calculateDocument(accord, document.data, document.kind, indices);
    if (result.issues.length > 0) throw new Error(result.issues.join(" "));

    // A prospectus has a single date: the one of the calculation is also the one printed on it.
    const data = structuredClone(document.data);
    if (document.kind === "prospectus") data.details.issueDate = data.calculation.contractDate;

    await downloadDocumentPdf({
        kind: document.kind,
        accord,
        data,
        result,
        documentNumber: document.documentNumber,
    });
}
