<script lang="ts">
    import "./layout.css";
    import type { LayoutProps } from "./$types";
    import favicon from "#lib/assets/favicon.svg";
    import SiteHeader from "#lib/components/site/site-header.svelte";
    import SiteFooter from "#lib/components/site/site-footer.svelte";

    let { children }: LayoutProps = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-dvh flex-col">
    <SiteHeader />
    <main class="flex-1">
        {@render children()}
    </main>
    <SiteFooter />
</div>
