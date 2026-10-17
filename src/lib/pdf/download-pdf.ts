import { buildDocumentPdf, pdfFileName, type PdfInput } from "./build-document.ts";

const LOGO_URL = "/images/logo-confedilizia-como.jpg";

async function loadLogo() {
    const blob = await (await fetch(LOGO_URL)).blob();
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
export async function downloadDocumentPdf(input: Omit<PdfInput, "logo">) {
    const [{ default: pdfMake }, { default: fonts }, logo] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
        loadLogo(),
    ]);

    pdfMake.addVirtualFileSystem(fonts);
    await pdfMake.createPdf(buildDocumentPdf({ ...input, logo })).download(pdfFileName(input));
}
