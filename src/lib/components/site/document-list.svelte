<script lang="ts">
    import { FileText } from "@lucide/svelte";
    import * as Card from "#lib/components/ui/card/index.ts";
    import type { DocumentLink } from "#lib/data/types.ts";

    interface Props {
        links: readonly DocumentLink[];
    }

    let { links }: Props = $props();

    const opensInNewTab = (href: string) => !href.startsWith("/") || href.startsWith("/docs/");
</script>

<Card.Root class="py-0">
    <ul class="divide-y">
        {#each links as link}
            <li>
                <a
                    href={link.href}
                    target={opensInNewTab(link.href) ? "_blank" : undefined}
                    rel={opensInNewTab(link.href) ? "noopener" : undefined}
                    class="flex items-start gap-3 p-4 transition-colors hover:bg-muted"
                >
                    <FileText class="mt-0.5 size-5 shrink-0 text-primary" />
                    <span>
                        <span class="font-medium">{link.title}</span>
                        {#if link.description}
                            <span class="block text-sm text-muted-foreground">
                                {link.description}
                            </span>
                        {/if}
                    </span>
                </a>
            </li>
        {/each}
    </ul>
</Card.Root>
