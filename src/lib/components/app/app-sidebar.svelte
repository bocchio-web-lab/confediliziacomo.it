<script lang="ts">
    import { page } from "$app/state";
    import {
        ChevronsUpDown,
        ClipboardList,
        FileCheck,
        Globe,
        LayoutDashboard,
        LogOut,
        TrendingUp,
    } from "@lucide/svelte";

    import * as Avatar from "#lib/components/ui/avatar/index.ts";
    import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.ts";
    import * as Sidebar from "#lib/components/ui/sidebar/index.ts";
    import IconConfediliziaComo from "#lib/assets/icon-confedilizia-como.svelte";
    import type { SessionUser } from "#lib/server/auth.ts";

    interface Props {
        user: SessionUser;
    }

    let { user }: Props = $props();

    const MENU_GROUPS = [
        {
            label: "Area riservata",
            entries: [{ label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard }],
        },
        {
            label: "Documenti",
            entries: [
                { label: "Prospetti di calcolo", href: "/app/prospetti", icon: ClipboardList },
                { label: "Attestazioni", href: "/app/attestazioni", icon: FileCheck },
            ],
        },
        {
            label: "Dati",
            entries: [{ label: "Indici ISTAT", href: "/app/istat", icon: TrendingUp }],
        },
    ];

    const initials = $derived(
        user.name
            .split(/\s+/)
            .map((word) => word[0])
            .slice(0, 2)
            .join("")
            .toUpperCase(),
    );
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
        {#each MENU_GROUPS as group}
            <Sidebar.Group>
                <Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
                <Sidebar.GroupContent>
                    <Sidebar.Menu>
                        {#each group.entries as entry}
                            <Sidebar.MenuItem>
                                <Sidebar.MenuButton isActive={page.url.pathname.startsWith(entry.href)}>
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
        {/each}
    </Sidebar.Content>

    <Sidebar.Footer>
        <Sidebar.Menu>
            <Sidebar.MenuItem>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        {#snippet child({ props })}
                            <Sidebar.MenuButton size="lg" {...props}>
                                <Avatar.Root class="size-8">
                                    <Avatar.Fallback>{initials}</Avatar.Fallback>
                                </Avatar.Root>
                                <span class="grid flex-1 text-left leading-tight">
                                    <span class="truncate font-medium">{user.name}</span>
                                    <span class="truncate text-xs text-muted-foreground">{user.email}</span>
                                </span>
                                <ChevronsUpDown class="ml-auto" />
                            </Sidebar.MenuButton>
                        {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content side="top" align="start" class="w-56">
                        <DropdownMenu.Item>
                            {#snippet child({ props })}
                                <a href="/" {...props}>
                                    <Globe />
                                    Torna al sito
                                </a>
                            {/snippet}
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <form method="POST" action="/app/logout">
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
            </Sidebar.MenuItem>
        </Sidebar.Menu>
    </Sidebar.Footer>
</Sidebar.Root>
