<script lang="ts">
    import { TriangleAlert } from "@lucide/svelte";
    import type { PageProps } from "./$types";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Alert from "#lib/components/ui/alert/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import { describeAudit } from "#lib/audit-labels.ts";
    import { formatDate, formatDateTime, formatNumber } from "#lib/format.ts";
    import { KIND_LABELS } from "#lib/documents/types.ts";

    let { data }: PageProps = $props();

    const NEW_DOCUMENT_CARDS = [
        { kind: "prospectus", description: "Calcola le fasce di canone minimo e massimo." },
        { kind: "attestation", description: "Redigi l'attestazione ex D.M. 16/1/2017." },
    ] as const;
</script>

<svelte:head>
    <title>Dashboard - Area riservata Confedilizia Como</title>
</svelte:head>

<div class="space-y-1">
    <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
    <p class="text-muted-foreground">Crea e consulta prospetti di calcolo e attestazioni di rispondenza.</p>
</div>

{#if data.istat.isCurrentMonthMissing}
    <Alert.Root variant="destructive">
        <TriangleAlert />
        <Alert.Title>Indice ISTAT del mese corrente mancante</Alert.Title>
        <Alert.Description>
            I calcoli per il Comune di Como usano l'ultimo indice disponibile. <a
                href="/app/istat"
                class="font-medium underline">Aggiorna gli indici ISTAT</a
            >.
        </Alert.Description>
    </Alert.Root>
{/if}

<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
    {#each NEW_DOCUMENT_CARDS as card}
        {@const labels = KIND_LABELS[card.kind]}
        <Card.Root>
            <Card.Header>
                <Card.Title>Nuovo documento: {labels.singular.toLowerCase()}</Card.Title>
                <Card.Description>{card.description}</Card.Description>
            </Card.Header>
            <Card.Content class="flex-row flex-wrap gap-2">
                <Button href="/app/{labels.slug}/nuovo/comune-di-como">Comune di Como</Button>
                <Button href="/app/{labels.slug}/nuovo/provincia-di-como" variant="outline">
                    Provincia di Como
                </Button>
            </Card.Content>
            <Card.Footer class="text-sm text-muted-foreground">
                <a href="/app/{labels.slug}" class="hover:underline">
                    {data.counts[card.kind] ?? 0} salvati: vedi l'elenco
                </a>
            </Card.Footer>
        </Card.Root>
    {/each}

    <Card.Root>
        <Card.Header>
            <Card.Title>Indici ISTAT</Card.Title>
            <Card.Description>
                {#if data.istat.latest}
                    Ultimo indice: <strong>{formatNumber(data.istat.latest.coefficient, 3)}</strong>
                    dal {formatDate(data.istat.latest.validFrom)}.
                {:else}
                    Nessun indice inserito.
                {/if}
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <Button href="/app/istat" variant="outline" class="w-fit">Aggiorna indici</Button>
        </Card.Content>
    </Card.Root>
</div>

<div class="grid gap-6 lg:grid-cols-2">
    <Card.Root>
        <Card.Header>
            <Card.Title>Ultimi documenti</Card.Title>
        </Card.Header>
        <Card.Content>
            {#if data.recentDocuments.length === 0}
                <p class="text-sm text-muted-foreground">Non ci sono ancora documenti salvati.</p>
            {:else}
                <ul class="divide-y">
                    {#each data.recentDocuments as document}
                        <li>
                            <a
                                href="/app/{KIND_LABELS[document.kind].slug}/{document.id}"
                                class="flex flex-col gap-0.5 py-2 hover:bg-muted/50"
                            >
                                <span class="font-medium">{document.title}</span>
                                <span class="text-sm text-muted-foreground">
                                    {KIND_LABELS[document.kind].singular}
                                    - {document.territory === "city" ? "Comune di Como" : "Provincia di Como"}
                                    - {document.updatedByName}, {formatDateTime(document.updatedAt)}
                                </span>
                            </a>
                        </li>
                    {/each}
                </ul>
            {/if}
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title>Attività recente</Card.Title>
            <Card.Description>Chi ha fatto cosa.</Card.Description>
        </Card.Header>
        <Card.Content>
            <ul class="divide-y text-sm">
                {#each data.recentActivity as entry}
                    <li class="py-2">
                        <span class="font-medium">{entry.userLabel}</span>
                        {describeAudit(entry)}
                        <span class="block text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                    </li>
                {/each}
            </ul>
        </Card.Content>
    </Card.Root>
</div>
