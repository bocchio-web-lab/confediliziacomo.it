import nodemailer from "nodemailer";
import { dev } from "$app/env";
import { SMTP_FROM, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER } from "$app/env/private";

export interface Mail {
    to: string;
    subject: string;
    text: string;
}

/**
 * Sends an email through the SMTP server in the environment variables.
 * Without a server the message is only printed (in development, so that links can be copied)
 * or reported as an error (in production). Returns whether it was really sent.
 */
export async function sendMail({ to, subject, text }: Mail) {
    if (!SMTP_HOST || !SMTP_FROM) {
        if (dev) {
            console.log(`\n--- Email (not sent: SMTP is not configured) ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n---`);
        } else {
            console.error("SMTP_HOST and SMTP_FROM are not set: the email was not sent.");
        }
        return false;
    }

    const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
    });
    await transport.sendMail({ from: SMTP_FROM, to, subject, text });
    return true;
}
