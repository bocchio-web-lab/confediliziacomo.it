<script lang="ts">
    import { goto } from "$app/navigation";
    import { navigating, page } from "$app/state";
    import { Download, Pencil, RotateCcw, Search } from "@lucide/svelte";
    import { untrack } from "svelte";
    import { toast } from "svelte-sonner";

    import { Badge } from "#lib/components/ui/badge/index.ts";
    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import { Input } from "#lib/components/ui/input/index.ts";
    import * as Select from "#lib/components/ui/select/index.ts";
    import * as Table from "#lib/components/ui/table/index.ts";
    import { SEQUENCE_LABELS } from "#lib/documents/numbering.ts";
    import { KIND_LABELS, documentLabel, type DocumentSummary } from "#lib/documents/types.ts";
    import { formatDateTime } from "#lib/format.ts";
    import { downloadStoredDocumentPdf } from "#lib/pdf/download-stored.ts";

    interface Filters {
        query: string;
        from: string;
        to: string;
        /** URL slug of the kind ("prospetti", "attestazioni") or empty for all. */
        kind: string;
        /** URL slug of the territory or empty for all. */
        territory: string;
    }

    interface Props {
        documents: DocumentSummary[];
        filters: Filters;
        page: number;
        pageSize: number;
        total: number;
    }

    let { documents, filters, page: pageNumber, pageSize, total }: Props = $props();

    const SEARCH_DELAY_MS = 300;
    const ALL = "all";

    const KIND_OPTIONS = [
        { value: ALL, label: "Tutti i documenti" },
        { value: "prospetti", label: "Prospetti" },
        { value: "attestazioni", label: "Attestazioni" },
    ];
    const TERRITORY_OPTIONS = [
        { value: ALL, label: "Comune e Provincia" },
        { value: "comune-di-como", label: SEQUENCE_LABELS.city },
        { value: "provincia-di-como", label: SEQUENCE_LABELS.province },
    ];

    // The filters as the user sees them now. They may be ahead of the address: the page is only
    // reloaded a moment after a change, and several changes can follow one another.
    let current = $state({ query: "", from: "", to: "", kind: "", territory: "" });
    let searchInput = $state<HTMLInputElement | null>(null);
    let searchTimer: ReturnType<typeof setTimeout> | undefined;
    let downloadingId = $state<string | null>(null);

    // Follows the address (e.g. the back button), but not while the user is typing or a change is on its way.
    $effect(() => {
        const fromAddress = { ...filters };
        if (navigating.to) return;
        untrack(() => {
            current = {
                ...fromAddress,
                query: document.activeElement === searchInput ? current.query : fromAddress.query,
            };
        });
    });

    const pageCount = $derived(Math.max(1, Math.ceil(total / pageSize)));
    const hasFilters = $derived(
        Boolean(current.query.trim() || current.from || current.to || current.kind || current.territory),
    );

    /** Opens the address of the current filters; the server returns the filtered list from the first page. */
    function applyFilters() {
        clearTimeout(searchTimer);
        const params = new URLSearchParams();
        const entries = {
            q: current.query.trim(),
            dal: current.from,
            al: current.to,
            tipo: current.kind,
            territorio: current.territory,
        };
        for (const [name, value] of Object.entries(entries)) if (value) params.set(name, value);

        const search = params.toString();
        // `reset: false` keeps the scroll position and the focus (the user may be typing).
        goto(search ? `?${search}` : page.url.pathname, { reset: false, replace: true });
    }

    function change(changes: Partial<typeof current>) {
        current = { ...current, ...changes };
        applyFilters();
    }

    function onSearchInput(event: Event & { currentTarget: HTMLInputElement }) {
        current.query = event.currentTarget.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(applyFilters, SEARCH_DELAY_MS);
    }

    function resetFilters() {
        clearTimeout(searchTimer);
        current = { query: "", from: "", to: "", kind: "", territory: "" };
        goto(page.url.pathname, { reset: false, replace: true });
    }

    function pageHref(target: number) {
        const params = new URLSearchParams(page.url.search);
        if (target <= 1) params.delete("pagina");
        else params.set("pagina", String(target));
        const search = params.toString();
        return search ? `?${search}` : page.url.pathname;
    }

    async function downloadPdf(id: string) {
        downloadingId = id;
        try {
            await downloadStoredDocumentPdf(id);
        } catch (error) {
            console.error(error);
            toast.error("Impossibile creare il PDF di questo documento.");
        } finally {
            downloadingId = null;
        }
    }
</script>

<Card.Root class="gap-0 py-0">
    <Card.Header class="gap-4 border-b py-4">
        <Card.Title>Documenti</Card.Title>
        <div class="flex flex-wrap items-end gap-3">
            <div class="relative min-w-60 flex-1">
                <Search
                    class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    bind:ref={searchInput}
                    type="search"
                    value={current.query}
                    oninput={onSearchInput}
                    placeholder="Cerca per nome, via o numero"
                    aria-label="Cerca per nome, via o numero"
                    class="pl-9"
                />
            </div>
            <label class="grid gap-1 text-xs text-muted-foreground">
                Creati dal
                <Input
                    type="date"
                    value={current.from}
                    max={current.to || undefined}
                    onchange={(event) => change({ from: event.currentTarget.value })}
                    class="w-40"
                />
            </label>
            <label class="grid gap-1 text-xs text-muted-foreground">
                al
                <Input
                    type="date"
                    value={current.to}
                    min={current.from || undefined}
                    onchange={(event) => change({ to: event.currentTarget.value })}
                    class="w-40"
                />
            </label>
            <Select.Root
                type="single"
                value={current.kind || ALL}
                onValueChange={(value) => change({ kind: value === ALL ? "" : value })}
            >
                <Select.Trigger class="w-44" aria-label="Tipo di documento">
                    {KIND_OPTIONS.find((option) => option.value === (current.kind || ALL))?.label}
                </Select.Trigger>
                <Select.Content>
                    {#each KIND_OPTIONS as option}
                        <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
                    {/each}
                </Select.Content>
            </Select.Root>
            <Select.Root
                type="single"
                value={current.territory || ALL}
                onValueChange={(value) => change({ territory: value === ALL ? "" : value })}
            >
                <Select.Trigger class="w-48" aria-label="Territorio">
                    {TERRITORY_OPTIONS.find((option) => option.value === (current.territory || ALL))?.label}
                </Select.Trigger>
                <Select.Content>
                    {#each TERRITORY_OPTIONS as option}
                        <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
                    {/each}
                </Select.Content>
            </Select.Root>
            {#if hasFilters}
                <Button variant="ghost" onclick={resetFilters}>
                    <RotateCcw />
                    Azzera
                </Button>
            {/if}
        </div>
    </Card.Header>

    <Table.Root>
        <Table.Header>
            <Table.Row>
                <Table.Head class="w-20 pl-6">N.</Table.Head>
                <Table.Head>Richiedente</Table.Head>
                <Table.Head>Documento</Table.Head>
                <Table.Head>Ultimo salvataggio</Table.Head>
                <Table.Head class="pr-6 text-right"><span class="sr-only">Azioni</span></Table.Head>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#each documents as document (document.id)}
                {@const label = documentLabel(document)}
                {@const kindLabels = KIND_LABELS[document.kind]}
                <Table.Row>
                    <Table.Cell class="pl-6 font-medium tabular-nums">{document.documentNumber}</Table.Cell>
                    <Table.Cell class="whitespace-normal">
                        <a href="/{kindLabels.slug}/{document.id}" class="font-semibold hover:underline">
                            {label.primary}
                        </a>
                        {#if label.secondary}
                            <span class="text-muted-foreground">({label.secondary})</span>
                        {/if}
                    </Table.Cell>
                    <Table.Cell class="whitespace-normal">
                        <Badge variant={document.kind === "prospectus" ? "secondary" : "outline"}>
                            {kindLabels.singular}
                        </Badge>
                        <span class="ml-1 text-sm text-muted-foreground">{SEQUENCE_LABELS[document.territory]}</span>
                    </Table.Cell>
                    <Table.Cell class="whitespace-normal text-sm text-muted-foreground">
                        {formatDateTime(document.updatedAt)}
                        <span class="block">{document.updatedByName}</span>
                    </Table.Cell>
                    <Table.Cell class="pr-6 text-right whitespace-nowrap">
                        <Button href="/{kindLabels.slug}/{document.id}" variant="outline" size="sm">
                            <Pencil />
                            Modifica
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={downloadingId === document.id}
                            onclick={() => downloadPdf(document.id)}
                        >
                            <Download />
                            {downloadingId === document.id ? "Creazione…" : "PDF"}
                        </Button>
                    </Table.Cell>
                </Table.Row>
            {:else}
                <Table.Row>
                    <Table.Cell colspan={5} class="py-8 text-center text-muted-foreground">
                        {hasFilters ? "Nessun documento corrisponde alla ricerca." : "Non ci sono ancora documenti."}
                    </Table.Cell>
                </Table.Row>
            {/each}
        </Table.Body>
    </Table.Root>

    <Card.Footer class="justify-between border-t py-3 text-sm text-muted-foreground">
        <span aria-live="polite">{total} {total === 1 ? "documento" : "documenti"}</span>
        {#if pageCount > 1}
            <nav class="flex items-center gap-2" aria-label="Pagine">
                <Button variant="outline" size="sm" href={pageHref(pageNumber - 1)} disabled={pageNumber <= 1}>
                    Precedente
                </Button>
                <span>Pagina {pageNumber} di {pageCount}</span>
                <Button variant="outline" size="sm" href={pageHref(pageNumber + 1)} disabled={pageNumber >= pageCount}>
                    Successiva
                </Button>
            </nav>
        {/if}
    </Card.Footer>
</Card.Root>
