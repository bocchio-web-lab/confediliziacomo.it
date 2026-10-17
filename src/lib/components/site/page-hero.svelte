<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        subtitle?: string;
        children?: Snippet;
    }

    let { title, subtitle, children }: Props = $props();
</script>

<section class="border-b bg-muted/40">
    <div class="container flex flex-col items-center gap-3 py-12 text-center">
        <h1 class="font-serif text-4xl font-black tracking-tight italic md:text-5xl">
            {title}
        </h1>
        {#if subtitle}
            <p class="text-lg text-primary italic md:text-xl">{subtitle}</p>
        {/if}
        {@render children?.()}
    </div>
</section>
