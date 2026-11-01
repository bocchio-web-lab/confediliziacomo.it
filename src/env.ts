import { defineEnvVars } from "@sveltejs/kit/env";

/** Empty values count as "not set". */
const optional = (value: string | undefined) => value?.trim() || undefined;

export const variables = defineEnvVars({
    DATABASE_URL: {
        description: "PostgreSQL connection string used by the app at runtime.",
        // Optional so that the project can be built without access to the database.
        schema: optional,
    },
    SITE_URL: {
        description:
            "Public address of the site (e.g. https://confediliziacomo.example), used in the links of the emails. Defaults to the address of the request.",
        schema: optional,
    },
    REGISTRATION_CODE: {
        description:
            "Secret code to give to the people allowed to sign up. When it is not set the registration page is disabled.",
        schema: optional,
    },
    SMTP_HOST: {
        description: "Mail server used to send the password reset emails. Without it no email is sent.",
        schema: optional,
    },
    SMTP_PORT: {
        description: "Port of the mail server (465 uses TLS, anything else STARTTLS). Defaults to 587.",
        schema: (value) => {
            if (!value?.trim()) return 587;
            const port = Number(value);
            if (!Number.isInteger(port) || port <= 0) throw new Error("SMTP_PORT must be a port number");
            return port;
        },
    },
    SMTP_USER: { description: "User of the mail server.", schema: optional },
    SMTP_PASSWORD: { description: "Password of the mail server.", schema: optional },
    SMTP_FROM: {
        description: 'Sender of the emails, e.g. "Confedilizia Como <info@confediliziacomo.it>".',
        schema: optional,
    },
});
