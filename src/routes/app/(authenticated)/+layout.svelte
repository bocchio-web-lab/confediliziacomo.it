<script lang="ts">
    import type { LayoutProps } from "./$types";

    import AppSidebar from "#lib/components/app/app-sidebar.svelte";
    import * as Separator from "#lib/components/ui/separator/index.ts";
    import * as Sidebar from "#lib/components/ui/sidebar/index.ts";
    import { Toaster } from "#lib/components/ui/sonner/index.ts";

    let { data, children }: LayoutProps = $props();
</script>

<Sidebar.Provider>
    <AppSidebar user={data.user} />
    <Sidebar.Inset>
        <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <Sidebar.Trigger class="-ml-1" />
            <Separator.Root orientation="vertical" class="mr-2 h-4" />
            <span class="text-sm text-muted-foreground">Area riservata</span>
        </header>
        <div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
            {@render children()}
        </div>
    </Sidebar.Inset>
</Sidebar.Provider>

<Toaster richColors position="top-center" />
