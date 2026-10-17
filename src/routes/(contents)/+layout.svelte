<script lang="ts">
    import type { LayoutProps } from "./$types";
    import SiteHeader from "#lib/components/site/site-header.svelte";
    import SiteFooter from "#lib/components/site/site-footer.svelte";

    let { children }: LayoutProps = $props();
</script>

<div class="flex min-h-dvh flex-col">
    <SiteHeader />
    <main class="flex-1">
        {@render children()}
    </main>
    <SiteFooter />
</div>
