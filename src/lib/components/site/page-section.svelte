<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        id: string;
        title: string;
        description?: string;
        children: Snippet;
    }

    let { id, title, description, children }: Props = $props();
</script>

<section {id} class="scroll-mt-24 space-y-6 py-10">
    <header class="space-y-1">
        <h2 class="text-2xl font-semibold tracking-tight">{title}</h2>
        {#if description}
            <p class="text-muted-foreground">{description}</p>
        {/if}
    </header>
    {@render children()}
</section>
