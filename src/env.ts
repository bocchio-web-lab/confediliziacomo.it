import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
    DATABASE_URL: {
        description: "PostgreSQL connection string used by the private area at runtime.",
        // Optional so that the public site can be built without access to the database.
        schema: (value) => value || undefined,
    },
});
