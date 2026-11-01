<script lang="ts">
    import { enhance } from "$app/forms";
    import { Download, Save, Trash2 } from "@lucide/svelte";
    import { onMount, untrack } from "svelte";
    import { toast } from "svelte-sonner";

    import { Badge } from "#lib/components/ui/badge/index.ts";
    import { Button } from "#lib/components/ui/button/index.ts";
    import * as AlertDialog from "#lib/components/ui/alert-dialog/index.ts";
    import * as Alert from "#lib/components/ui/alert/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Switch } from "#lib/components/ui/switch/index.ts";
    import { calculate } from "#lib/accords/calculate.ts";
    import { emptyCalculationInput, sanitizeCalculationInput } from "#lib/accords/input.ts";
    import { accordForForm } from "#lib/accords/registry.ts";
    import type { CalculationResult, IstatIndex, Territory } from "#lib/accords/types.ts";
    import {
        KIND_LABELS,
        dateNameOf,
        emptyDocumentDetails,
        type DocumentData,
        type DocumentKind,
    } from "#lib/documents/types.ts";
    import { todayIso } from "#lib/format.ts";
    import { downloadDocumentPdf } from "#lib/pdf/download-pdf.ts";
    import ClassificationSection from "./classification-section.svelte";
    import { helpState, loadHelpPreference, setShowAllHelp } from "./help.svelte.ts";
    import GeneralSection from "./general-section.svelte";
    import PartialLeaseSection from "./partial-lease-section.svelte";
    import PartiesSection from "./parties-section.svelte";
    import ResultPanel from "./result-panel.svelte";
    import SurchargesSection from "./surcharges-section.svelte";
    import SurfaceSection from "./surface-section.svelte";

    interface Props {
        kind: DocumentKind;
        territory: Territory;
        indices: readonly IstatIndex[];
        /** Present when an existing document is being edited. */
        documentId?: string;
        /** Number of the existing document. */
        documentNumber?: number;
        /** Number a new document will get, if it is saved now. */
        nextNumber?: number;
        initialData?: DocumentData;
        savedResult?: CalculationResult;
        /** Messages returned by the server when saving failed. */
        issues?: string[];
    }

    let {
        kind,
        territory,
        indices,
        documentId,
        documentNumber,
        nextNumber,
        initialData,
        savedResult,
        issues = [],
    }: Props = $props();

    const labels = $derived(KIND_LABELS[kind]);

    onMount(loadHelpPreference);

    const createInitialData = (): DocumentData => {
        if (initialData) return structuredClone($state.snapshot(initialData)) as DocumentData;
        return {
            calculation: emptyCalculationInput(accordForForm(territory, ""), todayIso()),
            details: { ...emptyDocumentDetails(), issueDate: todayIso() },
            requestedNumber: null,
        };
    };

    let data = $state<DocumentData>(createInitialData());
    let isSaving = $state(false);
    let isDownloading = $state(false);

    // The accord depends on the date: when it changes, the form follows.
    const accord = $derived(accordForForm(territory, data.calculation.contractDate));
    const result = $derived(calculate(accord, data.calculation, indices, dateNameOf(kind)));

    let currentAccordId = untrack(() => accord.id);
    $effect(() => {
        if (accord.id === currentAccordId) return;
        currentAccordId = accord.id;
        data.calculation = sanitizeCalculationInput($state.snapshot(data.calculation), accord);
    });

    // A prospectus has a single date: the one of the calculation is also the one printed on it.
    const exportData = $derived.by(() => {
        const snapshot = $state.snapshot(data) as DocumentData;
        if (kind === "prospectus") snapshot.details.issueDate = snapshot.calculation.contractDate;
        return snapshot;
    });
    const payload = $derived(JSON.stringify(exportData));
    const canExport = $derived(result.issues.length === 0);

    async function downloadPdf() {
        isDownloading = true;
        try {
            await downloadDocumentPdf({
                kind,
                accord,
                data: exportData,
                result,
                documentNumber: documentNumber ?? null,
            });
        } catch (error) {
            console.error(error);
            toast.error("Impossibile generare il PDF.");
        } finally {
            isDownloading = false;
        }
    }
</script>

<div class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-1">
        <h1 class="flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight">
            {documentId ? labels.singular : `Nuovo documento: ${labels.singular.toLowerCase()}`}
            {#if documentNumber !== undefined}
                <Badge variant="secondary" class="text-base">N. {documentNumber}</Badge>
            {/if}
        </h1>
        <p class="text-muted-foreground">{accord.territoryLabel} - {accord.agreementTitle}</p>
    </div>
    <div class="flex flex-wrap items-center gap-4">
        <Field.Field orientation="horizontal" class="w-auto">
            <Switch id="show-help" checked={helpState.showAll} onCheckedChange={setShowAllHelp} />
            <Field.Label for="show-help" class="font-normal">Mostra tutti gli aiuti</Field.Label>
        </Field.Field>
        <Button href="/" variant="ghost" size="sm">Torna all'elenco</Button>
    </div>
</div>

{#if issues.length > 0}
    <Alert.Root variant="destructive">
        <Alert.Title>Impossibile salvare</Alert.Title>
        <Alert.Description>
            <ul class="list-disc pl-4">
                {#each issues as issue}
                    <li>{issue}</li>
                {/each}
            </ul>
        </Alert.Description>
    </Alert.Root>
{/if}

<form
    method="POST"
    action={documentId ? "?/save" : undefined}
    use:enhance={() => {
        isSaving = true;
        return async ({ result: actionResult, update }) => {
            await update({ reset: false });
            isSaving = false;
            if (actionResult.type === "success") toast.success("Documento salvato.");
            // The reasons are also listed at the top of the page: the message tells the user to look there.
            if (actionResult.type === "failure") toast.error("Il documento non è stato salvato: controlla i messaggi in alto.");
        };
    }}
    class="grid items-start gap-6 xl:grid-cols-3"
>
    <input type="hidden" name="payload" value={payload} />

    <div class="space-y-6 xl:col-span-2">
        <GeneralSection {kind} {accord} bind:data nextNumber={documentId ? undefined : nextNumber} />
        <SurfaceSection {accord} bind:data {result} />
        <ClassificationSection {kind} {accord} bind:data {result} />
        <SurchargesSection {accord} bind:data />
        <PartialLeaseSection {kind} bind:data {result} />
        {#if kind === "attestation"}
            <PartiesSection bind:data />
        {/if}
    </div>

    <div class="space-y-4 xl:sticky xl:top-4">
        <ResultPanel {kind} {accord} {result} details={data.details} savedResult={savedResult ?? null} />

        {#if kind === "prospectus"}
            <Field.Field orientation="horizontal">
                <Switch id="show-signature" bind:checked={data.details.showSignature} />
                <Field.Label for="show-signature" class="font-normal">Firma e timbro nel PDF</Field.Label>
            </Field.Field>
        {/if}

        <div class="flex flex-wrap gap-2">
            <Button type="submit" disabled={!canExport || isSaving}>
                <Save />
                {isSaving ? "Salvataggio…" : "Salva"}
            </Button>
            <Button type="button" variant="outline" disabled={!canExport || isDownloading} onclick={downloadPdf}>
                <Download />
                {isDownloading ? "Creazione PDF…" : "Scarica PDF"}
            </Button>
        </div>
    </div>
</form>

{#if documentId}
    <div class="flex justify-end">
        <AlertDialog.Root>
            <AlertDialog.Trigger>
                {#snippet child({ props })}
                    <Button {...props} variant="destructive">
                        <Trash2 />
                        Elimina documento
                    </Button>
                {/snippet}
            </AlertDialog.Trigger>
            <AlertDialog.Content>
                <AlertDialog.Header>
                    <AlertDialog.Title>Eliminare il documento?</AlertDialog.Title>
                    <AlertDialog.Description>
                        Il documento scompare dall'elenco e il suo numero non viene riassegnato. L'operazione resta
                        registrata.
                    </AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                    <AlertDialog.Cancel>Annulla</AlertDialog.Cancel>
                    <form method="POST" action="?/delete" use:enhance>
                        <AlertDialog.Action type="submit">Elimina</AlertDialog.Action>
                    </form>
                </AlertDialog.Footer>
            </AlertDialog.Content>
        </AlertDialog.Root>
    </div>
{/if}
