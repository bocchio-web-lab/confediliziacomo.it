<script lang="ts">
    import { page } from "$app/state";
    import { afterNavigate } from "$app/navigation";
    import { Mail, MapPin, Menu, Phone } from "@lucide/svelte";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Accordion from "#lib/components/ui/accordion/index.ts";
    import * as NavigationMenu from "#lib/components/ui/navigation-menu/index.ts";
    import * as Sheet from "#lib/components/ui/sheet/index.ts";
    import IconConfediliziaComo from "#lib/assets/icon-confedilizia-como.svelte";
    import { CONTACTS } from "#lib/contacts.ts";
    import { MENU_ENTRIES, type MenuEntry } from "#lib/data/navigation.ts";

    let isMobileMenuOpen = $state(false);

    afterNavigate(() => {
        isMobileMenuOpen = false;
    });

    const isActive = (entry: MenuEntry) =>
        entry.href === "/"
            ? page.url.pathname === "/"
            : page.url.pathname.startsWith(entry.href);
</script>

<div class="bg-muted text-sm text-muted-foreground print:hidden">
    <div class="container flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
        <div class="flex flex-wrap items-center gap-x-5 gap-y-1">
            <a href={CONTACTS.phone.href} class="flex items-center gap-1.5 hover:text-foreground">
                <Phone class="size-3.5" />
                {CONTACTS.phone.label}
            </a>
            <a href="mailto:{CONTACTS.email}" class="flex items-center gap-1.5 hover:text-foreground">
                <Mail class="size-3.5" />
                {CONTACTS.email}
            </a>
        </div>
        <address class="hidden items-center gap-1.5 not-italic md:flex">
            <MapPin class="size-3.5" />
            {CONTACTS.address.street} - {CONTACTS.address.zipCode}
            {CONTACTS.address.city}
        </address>
    </div>
</div>

<header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur print:hidden">
    <div class="container flex h-16 items-center justify-between gap-4">
        <a href="/" class="flex shrink-0 items-center gap-3" aria-label="Confedilizia Como, pagina iniziale">
            <IconConfediliziaComo class="h-9 w-auto" />
            <span class="hidden font-serif text-primary italic sm:block">{CONTACTS.slogan}</span>
        </a>

        <div class="hidden lg:block">
            <NavigationMenu.Root>
                <NavigationMenu.List>
                    {#each MENU_ENTRIES as entry}
                        <NavigationMenu.Item>
                            <NavigationMenu.Trigger class={isActive(entry) ? "text-primary" : ""}>
                                {entry.label}
                            </NavigationMenu.Trigger>
                            <NavigationMenu.Content>
                                <ul class="grid w-96 gap-1 md:grid-cols-2 lg:w-xl">
                                    <li class="md:col-span-2">
                                        <NavigationMenu.Link href={entry.href} class="font-semibold">
                                            {entry.label}
                                        </NavigationMenu.Link>
                                    </li>
                                    {#each entry.subMenuEntries as subEntry}
                                        <li>
                                            <NavigationMenu.Link href={subEntry.href}>
                                                {subEntry.label}
                                            </NavigationMenu.Link>
                                        </li>
                                    {/each}
                                </ul>
                            </NavigationMenu.Content>
                        </NavigationMenu.Item>
                    {/each}
                </NavigationMenu.List>
            </NavigationMenu.Root>
        </div>

        <div class="lg:hidden">
            <Sheet.Root bind:open={isMobileMenuOpen}>
                <Sheet.Trigger>
                    {#snippet child({ props })}
                        <Button {...props} variant="ghost" size="icon">
                            <Menu />
                            <span class="sr-only">Apri il menu</span>
                        </Button>
                    {/snippet}
                </Sheet.Trigger>
                <Sheet.Content side="right" class="overflow-y-auto">
                    <Sheet.Header>
                        <Sheet.Title>Menu</Sheet.Title>
                        <Sheet.Description class="sr-only">
                            Navigazione principale del sito
                        </Sheet.Description>
                    </Sheet.Header>
                    <Accordion.Root type="single" class="px-4">
                        {#each MENU_ENTRIES as entry}
                            <Accordion.Item value={entry.href}>
                                <Accordion.Trigger>{entry.label}</Accordion.Trigger>
                                <Accordion.Content>
                                    <ul class="flex flex-col gap-2">
                                        <li>
                                            <a href={entry.href} class="font-medium text-primary">
                                                Vai a {entry.label}
                                            </a>
                                        </li>
                                        {#each entry.subMenuEntries as subEntry}
                                            <li>
                                                <a href={subEntry.href} class="hover:underline">
                                                    {subEntry.label}
                                                </a>
                                            </li>
                                        {/each}
                                    </ul>
                                </Accordion.Content>
                            </Accordion.Item>
                        {/each}
                    </Accordion.Root>
                </Sheet.Content>
            </Sheet.Root>
        </div>
    </div>
</header>
