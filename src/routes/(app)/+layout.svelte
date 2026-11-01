<script lang="ts">
    import { ChevronDown, LogOut, TrendingUp } from "@lucide/svelte";
    import type { LayoutProps } from "./$types";

    import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.ts";
    import { Button } from "#lib/components/ui/button/index.ts";
    import { Toaster } from "#lib/components/ui/sonner/index.ts";
    import IconConfediliziaComo from "#lib/assets/icon-confedilizia-como.svelte";

    let { data, children }: LayoutProps = $props();
</script>

<div class="flex min-h-dvh flex-col bg-muted/30">
    <header class="border-b bg-background">
        <div class="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
            <a href="/" class="flex items-center gap-3" aria-label="Confedilizia Como, pagina iniziale">
                <IconConfediliziaComo class="h-8 w-auto" />
                <span class="hidden font-serif text-primary italic sm:block">Confedilizia Como</span>
            </a>

            <nav class="flex items-center gap-1">
                <Button href="/istat" variant="ghost" size="sm">
                    <TrendingUp />
                    Indici ISTAT
                </Button>

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        {#snippet child({ props })}
                            <Button {...props} variant="ghost" size="sm">
                                <span class="max-w-40 truncate">{data.user.name}</span>
                                <ChevronDown />
                            </Button>
                        {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end" class="w-56">
                        <DropdownMenu.Label class="font-normal">
                            <span class="block truncate font-medium">{data.user.name}</span>
                            <span class="block truncate text-xs text-muted-foreground">{data.user.email}</span>
                        </DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        <form method="POST" action="/logout">
                            <DropdownMenu.Item>
                                {#snippet child({ props })}
                                    <button type="submit" {...props}>
                                        <LogOut />
                                        Esci
                                    </button>
                                {/snippet}
                            </DropdownMenu.Item>
                        </form>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </nav>
        </div>
    </header>

    <main class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6">
        {@render children()}
    </main>
</div>

<Toaster richColors position="top-center" />
