<script lang="ts">
    import { page } from "$app/state";
    import type { PageProps } from "./$types";

    import DocumentEditor from "#lib/components/app/document/document-editor.svelte";
    import { KIND_LABELS } from "#lib/documents/types.ts";

    let { data, form }: PageProps = $props();
</script>

<svelte:head>
    <title>Nuovo documento: {KIND_LABELS[data.kind].singular} - Area riservata Confedilizia Como</title>
</svelte:head>

{#key page.url.pathname}
    <DocumentEditor
        kind={data.kind}
        territory={data.territory}
        indices={data.indices}
        nextNumber={data.nextNumber}
        issues={form?.issues}
    />
{/key}
