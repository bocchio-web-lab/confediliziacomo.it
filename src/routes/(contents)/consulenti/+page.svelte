<script lang="ts">
    import * as Card from "#lib/components/ui/card/index.ts";
    import PageHero from "#lib/components/site/page-hero.svelte";
    import { CONSULTANT_AREAS } from "#lib/data/consultants.ts";
</script>

<svelte:head>
    <title>I consulenti - Confedilizia Como</title>
    <meta
        name="description"
        content="Consulenti legali, fiscali, tecnici e assicurativi dell'Associazione della Proprietà Edilizia di Como."
    />
</svelte:head>

<PageHero
    title="I consulenti dell'associazione"
    subtitle="ai quali vengono sottoposti i quesiti degli associati"
/>

<div class="container grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
    {#each CONSULTANT_AREAS as area}
        <Card.Root id={area.id} class="scroll-mt-24">
            <Card.Header>
                <Card.Title>{area.title}</Card.Title>
            </Card.Header>
            <Card.Content>
                <ul class="flex flex-col gap-1">
                    {#each area.members as member}
                        <li class="text-muted-foreground">{member}</li>
                    {/each}
                </ul>
            </Card.Content>
        </Card.Root>
    {/each}
</div>
