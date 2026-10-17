<script lang="ts">
    import { onMount } from "svelte";
    import { replaceState } from "$app/navigation";
    import { page } from "$app/state";
    import { toast } from "svelte-sonner";
    import type { PageProps } from "./$types";

    import DocumentEditor from "#lib/components/app/document/document-editor.svelte";
    import { KIND_LABELS } from "#lib/documents/types.ts";
    import { formatDateTime } from "#lib/format.ts";

    let { data, form }: PageProps = $props();

    // Right after creation the server redirects here with `?created`.
    onMount(() => {
        if (page.url.searchParams.has("created")) {
            toast.success("Documento salvato.");
            replaceState(page.url.pathname, {});
        }
    });
</script>

<svelte:head>
    <title>{data.document.title} - Area riservata Confedilizia Como</title>
</svelte:head>

{#key data.document.id + data.document.updatedAt}
    <DocumentEditor
        kind={data.kind}
        territory={data.document.territory}
        indices={data.indices}
        documentId={data.document.id}
        initialData={data.document.data}
        savedResult={data.document.result}
        issues={form && "issues" in form ? form.issues : undefined}
    />
{/key}

<p class="text-sm text-muted-foreground">
    {KIND_LABELS[data.kind].singular} creato da {data.document.createdByName}
    il {formatDateTime(data.document.createdAt)}. Ultima modifica: {data.document.updatedByName},
    {formatDateTime(data.document.updatedAt)}.
</p>
