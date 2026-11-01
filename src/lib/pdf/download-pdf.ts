import { buildDocumentPdf, pdfFileName, type PdfInput } from "./build-document.ts";

const LOGO_URL = "/images/logo-confedilizia-como.jpg";
// Not a static file: only logged-in users can get the signature and stamp.
const SIGNATURE_URL = "/api/signature";

async function loadImage(url: string) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Immagine non disponibile: ${url}`);

    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

/**
 * Builds the PDF in the browser and starts the download. The PDF library and its fonts
 * are loaded on demand, so they do not weigh on the rest of the private area.
 */
export async function downloadDocumentPdf(input: Omit<PdfInput, "logo" | "signature">) {
    // Signature and stamp are only printed on prospectuses, if the user wants them.
    const needsSignature = input.kind === "prospectus" && input.data.details.showSignature;

    const [{ default: pdfMake }, { default: fonts }, logo, signature] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
        loadImage(LOGO_URL),
        needsSignature ? loadImage(SIGNATURE_URL) : Promise.resolve(null),
    ]);

    pdfMake.addVirtualFileSystem(fonts);
    await pdfMake.createPdf(buildDocumentPdf({ ...input, logo, signature })).download(pdfFileName(input));
}
