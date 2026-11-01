<script lang="ts">
    import * as Card from "#lib/components/ui/card/index.ts";
    import PageHero from "#lib/components/site/page-hero.svelte";
    import PageSection from "#lib/components/site/page-section.svelte";
    import { BOARD_SECTIONS, BOARD_TERM } from "#lib/data/board.ts";
</script>

<svelte:head>
    <title>Il consiglio direttivo - Confedilizia Como</title>
    <meta
        name="description"
        content="Presidente, vicepresidenti, tesoriere, consiglieri e revisori dei conti di Confedilizia Como."
    />
</svelte:head>

<PageHero title="Il consiglio direttivo" subtitle={BOARD_TERM} />

<div class="container divide-y pb-12">
    {#each BOARD_SECTIONS as section}
        <PageSection id={section.id} title={section.title}>
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {#each section.roles as role}
                    <Card.Root size="sm">
                        <Card.Header>
                            <Card.Title>{role.title}</Card.Title>
                        </Card.Header>
                        <Card.Content>
                            <ul class="flex flex-col gap-1">
                                {#each role.members as member}
                                    <li class="text-muted-foreground">{member}</li>
                                {/each}
                            </ul>
                        </Card.Content>
                    </Card.Root>
                {/each}
            </div>
        </PageSection>
    {/each}
</div>
