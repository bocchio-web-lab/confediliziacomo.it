<script lang="ts">
    import { TriangleAlert } from "@lucide/svelte";
    import type { PageProps } from "./$types";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Alert from "#lib/components/ui/alert/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import DocumentsList from "#lib/components/app/documents-list.svelte";
    import NewDocumentTable from "#lib/components/app/new-document-table.svelte";
    import { formatDate, formatNumber } from "#lib/format.ts";

    let { data }: PageProps = $props();
</script>

<svelte:head>
    <title>Documenti - Confedilizia Como</title>
</svelte:head>

<div class="grid items-start gap-6 lg:grid-cols-3">
    <div class="lg:col-span-2">
        <NewDocumentTable />
    </div>

    <Card.Root>
        <Card.Header>
            <Card.Title>Indice ISTAT</Card.Title>
            <Card.Description>
                {#if data.istat.latest}
                    Ultimo inserito: <strong>{formatNumber(data.istat.latest.coefficient, 3)}</strong>
                    dal {formatDate(data.istat.latest.validFrom)}.
                {:else}
                    Nessun indice inserito.
                {/if}
            </Card.Description>
        </Card.Header>
        <Card.Content>
            {#if data.istat.isCurrentMonthMissing}
                <Alert.Root variant="destructive">
                    <TriangleAlert />
                    <Alert.Title>Manca l'indice del mese</Alert.Title>
                    <Alert.Description>
                        I calcoli per il Comune di Como usano l'ultimo indice disponibile.
                    </Alert.Description>
                </Alert.Root>
            {/if}
        </Card.Content>
        <Card.Footer>
            <Button href="/istat" variant={data.istat.isCurrentMonthMissing ? "default" : "outline"} size="sm">
                Aggiorna indici
            </Button>
        </Card.Footer>
    </Card.Root>
</div>

<DocumentsList
    documents={data.documents}
    filters={data.filters}
    page={data.page}
    pageSize={data.pageSize}
    total={data.total}
/>
