<script lang="ts">
    import { Search } from "@lucide/svelte";

    import { Badge } from "#lib/components/ui/badge/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import { Input } from "#lib/components/ui/input/index.ts";
    import { Label } from "#lib/components/ui/label/index.ts";
    import * as Table from "#lib/components/ui/table/index.ts";
    import DocumentList from "#lib/components/site/document-list.svelte";
    import PageHero from "#lib/components/site/page-hero.svelte";
    import PageSection from "#lib/components/site/page-section.svelte";
    import TrainingCard from "#lib/components/site/training-card.svelte";
    import {
        ADMINISTRATORS,
        CERTIFICATION_LABELS,
        type Administrator,
    } from "#lib/data/administrators.ts";
    import {
        REGISTER_REFERENCES,
        STANDARD_ACCOUNTING_REPORT,
    } from "#lib/data/administrators-register.ts";

    let searchQuery = $state("");

    const matchesQuery = (administrator: Administrator, query: string) =>
        [administrator.name, ...administrator.addresses, ...administrator.emails]
            .join(" ")
            .toLowerCase()
            .includes(query.trim().toLowerCase());

    const filteredAdministrators = $derived(
        ADMINISTRATORS.filter((administrator) => matchesQuery(administrator, searchQuery)),
    );
</script>

<svelte:head>
    <title>Il registro degli amministratori - Confedilizia Como</title>
    <meta
        name="description"
        content="Elenco degli amministratori di condominio e di stabili iscritti al registro di Confedilizia Como."
    />
</svelte:head>

<PageHero title="Il registro degli amministratori" subtitle="tenuto da Confedilizia Como" />

<div class="container divide-y pb-12">
    <PageSection id="elenco" title="Elenco degli iscritti">
        <TrainingCard />

        <div class="flex flex-col gap-2">
            <Label for="administrator-search" class="sr-only">Cerca un amministratore</Label>
            <div class="relative max-w-sm">
                <Search
                    class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    id="administrator-search"
                    type="search"
                    placeholder="Cerca per nome, comune o email"
                    class="pl-9"
                    bind:value={searchQuery}
                />
            </div>
            <p class="text-sm text-muted-foreground" aria-live="polite">
                {filteredAdministrators.length} di {ADMINISTRATORS.length} amministratori
            </p>
        </div>

        <Card.Root class="py-0">
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Nominativo</Table.Head>
                        <Table.Head>Sede</Table.Head>
                        <Table.Head>Contatti</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each filteredAdministrators as administrator}
                        <Table.Row>
                            <Table.Cell class="align-top whitespace-normal">
                                <span class="font-medium">{administrator.name}</span>
                                {#each administrator.certifications as certification}
                                    <Badge variant="secondary" class="ml-1">
                                        {CERTIFICATION_LABELS[certification]}
                                    </Badge>
                                {/each}
                            </Table.Cell>
                            <Table.Cell class="align-top whitespace-normal">
                                {#each administrator.addresses as address}
                                    <div>{address}</div>
                                {/each}
                            </Table.Cell>
                            <Table.Cell class="align-top whitespace-normal">
                                {#each administrator.phones as phone}
                                    <div>{phone}</div>
                                {/each}
                                {#each administrator.emails as email}
                                    <div>
                                        <a href="mailto:{email}" class="text-primary hover:underline">
                                            {email}
                                        </a>
                                    </div>
                                {/each}
                            </Table.Cell>
                        </Table.Row>
                    {:else}
                        <Table.Row>
                            <Table.Cell colspan={3} class="text-center text-muted-foreground">
                                Nessun amministratore corrisponde alla ricerca.
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>
        </Card.Root>
    </PageSection>

    <PageSection id="regolamenti" title="Registro nazionale e regolamenti">
        <DocumentList links={REGISTER_REFERENCES} />
    </PageSection>

    <PageSection id="rendiconto-tipo" title="Rendiconto tipo">
        <div class="max-w-3xl space-y-4 leading-relaxed">
            {#each STANDARD_ACCOUNTING_REPORT as paragraph}
                <p>{paragraph}</p>
            {/each}
        </div>
    </PageSection>
</div>
