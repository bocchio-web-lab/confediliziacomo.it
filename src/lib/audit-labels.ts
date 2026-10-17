import { formatDate, formatNumber } from "./format.ts";

interface AuditRow {
    action: string;
    entityType: string;
    entityId: string | null;
    details: Record<string, unknown>;
}

const DOCUMENT_NAMES: Record<string, string> = {
    prospectus: "il prospetto",
    attestation: "l'attestazione",
};

/** A short Italian sentence describing an audit log row, without the name of the user. */
export function describeAudit({ action, entityType, entityId, details }: AuditRow): string {
    const documentName = DOCUMENT_NAMES[entityType] ?? "il documento";
    const title = typeof details.title === "string" ? ` «${details.title}»` : "";

    switch (action) {
        case "document.create":
            return `ha creato ${documentName}${title}`;
        case "document.update":
            return `ha modificato ${documentName}${title}`;
        case "document.delete":
            return `ha eliminato ${documentName}${title}`;
        case "istat.create":
        case "istat.update": {
            const verb = action === "istat.create" ? "ha inserito" : "ha modificato";
            const coefficient = typeof details.coefficient === "number" ? ` (${formatNumber(details.coefficient, 3)})` : "";
            return `${verb} l'indice ISTAT dal ${formatDate(entityId)}${coefficient}`;
        }
        case "istat.delete":
            return `ha eliminato l'indice ISTAT dal ${formatDate(entityId)}`;
        case "auth.login":
            return "ha effettuato l'accesso";
        case "auth.logout":
            return "ha effettuato l'uscita";
        case "auth.login-failed":
            return "tentativo di accesso non riuscito";
        case "auth.login-blocked":
            return "tentativo di accesso bloccato (troppi tentativi)";
        default:
            return action;
    }
}
