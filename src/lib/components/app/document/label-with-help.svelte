<script lang="ts">
    import { Info } from "@lucide/svelte";
    import type { Snippet } from "svelte";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { helpState } from "./help.svelte.ts";

    interface Props {
        /** Id of the field the label belongs to. */
        for?: string;
        /** The text of the label. */
        children: Snippet;
        /** The explanation: shown under the label, always or when the info button is pressed. */
        help?: Snippet | string;
        class?: string;
    }

    let { for: fieldId, children, help, class: className }: Props = $props();

    let isOpen = $state(false);

    const isVisible = $derived(helpState.showAll || isOpen);
</script>

<div class="flex flex-wrap items-center gap-x-1">
    <Field.Label for={fieldId} class={className}>{@render children()}</Field.Label>
    {#if help && !helpState.showAll}
        <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            class="text-muted-foreground"
            aria-label="Mostra o nascondi la spiegazione"
            aria-expanded={isOpen}
            onclick={() => (isOpen = !isOpen)}
        >
            <Info />
        </Button>
    {/if}
    {#if help && isVisible}
        <p class="basis-full text-sm font-normal text-muted-foreground">
            {#if typeof help === "string"}{help}{:else}{@render help()}{/if}
        </p>
    {/if}
</div>
