<script lang="ts">
    import { page } from "$app/state";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import { TERRITORY_SLUGS } from "#lib/accords/registry.ts";
    import { KIND_LABELS, KIND_SLUGS } from "#lib/documents/types.ts";

    const labels = $derived(KIND_LABELS[KIND_SLUGS[page.params.kind!]]);
</script>

<svelte:head>
    <title>Nuovo documento - Area riservata Confedilizia Como</title>
</svelte:head>

<div class="space-y-1">
    <h1 class="text-2xl font-semibold tracking-tight">{labels.singular}: scegli il territorio</h1>
    <p class="text-muted-foreground">
        Il Comune di Como e il resto della provincia hanno due accordi territoriali distinti.
    </p>
</div>

<div class="grid gap-6 md:grid-cols-2">
    {#each Object.keys(TERRITORY_SLUGS) as slug}
        <Card.Root>
            <Card.Header>
                <Card.Title>{slug === "comune-di-como" ? "Comune di Como" : "Provincia di Como"}</Card.Title>
                <Card.Description>
                    {slug === "comune-di-como"
                        ? "Accordo per il Comune di Como, con microzone e indici ISTAT."
                        : "Accordo per gli altri comuni della provincia, con tabella annuale dei canoni."}
                </Card.Description>
            </Card.Header>
            <Card.Footer>
                <Button href="/app/{labels.slug}/nuovo/{slug}">Continua</Button>
            </Card.Footer>
        </Card.Root>
    {/each}
</div>
