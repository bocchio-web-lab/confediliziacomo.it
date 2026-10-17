<script lang="ts">
    import { page } from "$app/state";
    import {
        ChevronsUpDown,
        FileText,
        Globe,
        LayoutDashboard,
        LogOut,
        Users,
    } from "@lucide/svelte";

    import * as Avatar from "#lib/components/ui/avatar/index.ts";
    import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.ts";
    import * as Sidebar from "#lib/components/ui/sidebar/index.ts";
    import IconConfediliziaComo from "#lib/assets/icon-confedilizia-como.svelte";

    const APP_ENTRIES = [{ label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard }];

    const SITE_ENTRIES = [
        { label: "Normativa", href: "/normativa", icon: FileText },
        { label: "Registro amministratori", href: "/registro-amministratori", icon: Users },
        { label: "Sito pubblico", href: "/", icon: Globe },
    ];
</script>

<Sidebar.Root>
    <Sidebar.Header>
        <Sidebar.Menu>
            <Sidebar.MenuItem>
                <Sidebar.MenuButton size="lg">
                    {#snippet child({ props })}
                        <a href="/app/dashboard" {...props}>
                            <IconConfediliziaComo class="h-6 w-auto" />
                            <span class="font-serif font-medium">Confedilizia Como</span>
                        </a>
                    {/snippet}
                </Sidebar.MenuButton>
            </Sidebar.MenuItem>
        </Sidebar.Menu>
    </Sidebar.Header>

    <Sidebar.Content>
        <Sidebar.Group>
            <Sidebar.GroupLabel>Area riservata</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
                <Sidebar.Menu>
                    {#each APP_ENTRIES as entry}
                        <Sidebar.MenuItem>
                            <Sidebar.MenuButton isActive={page.url.pathname === entry.href}>
                                {#snippet child({ props })}
                                    <a href={entry.href} {...props}>
                                        <entry.icon />
                                        <span>{entry.label}</span>
                                    </a>
                                {/snippet}
                            </Sidebar.MenuButton>
                        </Sidebar.MenuItem>
                    {/each}
                </Sidebar.Menu>
            </Sidebar.GroupContent>
        </Sidebar.Group>

        <Sidebar.Group>
            <Sidebar.GroupLabel>Collegamenti</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
                <Sidebar.Menu>
                    {#each SITE_ENTRIES as entry}
                        <Sidebar.MenuItem>
                            <Sidebar.MenuButton>
                                {#snippet child({ props })}
                                    <a href={entry.href} {...props}>
                                        <entry.icon />
                                        <span>{entry.label}</span>
                                    </a>
                                {/snippet}
                            </Sidebar.MenuButton>
                        </Sidebar.MenuItem>
                    {/each}
                </Sidebar.Menu>
            </Sidebar.GroupContent>
        </Sidebar.Group>
    </Sidebar.Content>

    <Sidebar.Footer>
        <Sidebar.Menu>
            <Sidebar.MenuItem>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        {#snippet child({ props })}
                            <Sidebar.MenuButton size="lg" {...props}>
                                <Avatar.Root class="size-8">
                                    <Avatar.Fallback>SC</Avatar.Fallback>
                                </Avatar.Root>
                                <span class="flex-1 truncate font-medium">Socio</span>
                                <ChevronsUpDown class="ml-auto" />
                            </Sidebar.MenuButton>
                        {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content side="top" align="start" class="w-56">
                        <DropdownMenu.Item>
                            {#snippet child({ props })}
                                <a href="/app/login" {...props}>
                                    <LogOut />
                                    Esci
                                </a>
                            {/snippet}
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </Sidebar.MenuItem>
        </Sidebar.Menu>
    </Sidebar.Footer>
</Sidebar.Root>
