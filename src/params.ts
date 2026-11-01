import { defineParams } from "@sveltejs/kit/params";
import { TERRITORY_SLUGS } from "#lib/accords/registry.ts";
import { KIND_SLUGS } from "#lib/documents/types.ts";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const params = defineParams({
    documentKind: (param) => (Object.hasOwn(KIND_SLUGS, param) ? param : undefined),
    territory: (param) => (Object.hasOwn(TERRITORY_SLUGS, param) ? param : undefined),
    uuid: (param) => (UUID_PATTERN.test(param) ? param : undefined),
});
