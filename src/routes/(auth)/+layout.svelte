<script lang="ts">
    import type { LayoutProps } from "./$types";
    import IconConfediliziaComo from "#lib/assets/icon-confedilizia-como.svelte";

    let { children }: LayoutProps = $props();
</script>

<div class="flex min-h-dvh flex-col items-center justify-center gap-6 bg-muted/40 p-6">
    <div class="flex items-center gap-3">
        <IconConfediliziaComo class="h-10 w-auto" />
        <span class="font-serif text-lg text-primary italic">Confedilizia Como</span>
    </div>

    <div class="w-full max-w-sm">
        {@render children()}
    </div>
</div>
