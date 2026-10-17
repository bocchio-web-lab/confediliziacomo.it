<script lang="ts">
    import type { PageProps } from "./$types";

    import { Button } from "#lib/components/ui/button/index.ts";
    import { Badge } from "#lib/components/ui/badge/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Table from "#lib/components/ui/table/index.ts";
    import { formatDate, formatDateTime, formatMoney } from "#lib/format.ts";
    import { KIND_LABELS } from "#lib/documents/types.ts";

    let { data }: PageProps = $props();

    const labels = $derived(KIND_LABELS[data.kind]);
</script>

<svelte:head>
    <title>{labels.plural} - Area riservata Confedilizia Como</title>
</svelte:head>

<div class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">{labels.plural}</h1>
        <p class="text-muted-foreground">{data.documents.length} documenti salvati.</p>
    </div>
    <div class="flex flex-wrap gap-2">
        <Button href="/app/{labels.slug}/nuovo/comune-di-como">Nuovo: Comune di Como</Button>
        <Button href="/app/{labels.slug}/nuovo/provincia-di-como" variant="outline">
            Nuovo: Provincia di Como
        </Button>
    </div>
</div>

<Card.Root class="py-0">
    <Table.Root>
        <Table.Header>
            <Table.Row>
                <Table.Head>N.</Table.Head>
                <Table.Head>Immobile</Table.Head>
                <Table.Head>Territorio</Table.Head>
                <Table.Head>Stipula</Table.Head>
                <Table.Head class="text-right">Canone mensile (min / max)</Table.Head>
                <Table.Head>Ultima modifica</Table.Head>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#each data.documents as document (document.id)}
                <Table.Row>
                    <Table.Cell>{document.number ?? ""}</Table.Cell>
                    <Table.Cell class="font-medium">
                        <a href="/app/{labels.slug}/{document.id}" class="hover:underline">{document.title}</a>
                    </Table.Cell>
                    <Table.Cell>
                        <Badge variant="secondary">
                            {document.territory === "city" ? "Comune di Como" : "Provincia di Como"}
                        </Badge>
                    </Table.Cell>
                    <Table.Cell>{formatDate(document.contractDate)}</Table.Cell>
                    <Table.Cell class="text-right">
                        {#if document.monthlyMin !== null && document.monthlyMax !== null}
                            {formatMoney(document.monthlyMin)} / {formatMoney(document.monthlyMax)}
                        {/if}
                    </Table.Cell>
                    <Table.Cell class="whitespace-normal text-muted-foreground">
                        {document.updatedByName}, {formatDateTime(document.updatedAt)}
                    </Table.Cell>
                </Table.Row>
            {:else}
                <Table.Row>
                    <Table.Cell colspan={6} class="text-center text-muted-foreground">
                        Non ci sono ancora documenti.
                    </Table.Cell>
                </Table.Row>
            {/each}
        </Table.Body>
    </Table.Root>
</Card.Root>
