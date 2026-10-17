<script lang="ts">
    import { ExternalLink, FileText, Info } from "@lucide/svelte";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Accordion from "#lib/components/ui/accordion/index.ts";
    import * as Alert from "#lib/components/ui/alert/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Table from "#lib/components/ui/table/index.ts";
    import DocumentList from "#lib/components/site/document-list.svelte";
    import PageHero from "#lib/components/site/page-hero.svelte";
    import PageSection from "#lib/components/site/page-section.svelte";
    import { CONTACTS } from "#lib/contacts.ts";
    import { LEASE_CHECKLIST, LEASE_CHECKLIST_NOTICE } from "#lib/data/lease-checklist.ts";
    import { LEGAL_INTEREST_RATES } from "#lib/data/legal-interest-rates.ts";
    import {
        ANNUAL_TAX_RATE,
        LEASE_TAX_CODES,
        LOAN_FOR_USE,
        MINIMUM_TAX,
        MINIMUM_TAX_NOTE,
        REGISTRY_OFFICE_CODES,
        ROUNDING_RULE,
    } from "#lib/data/registration-tax.ts";
    import {
        BASEMENT_RECOVERY,
        CONDOMINIUM_REFORM,
        CONDOMINIUM_REFORM_NOTE,
        FLAT_TAX,
        FLAT_TAX_NOTE,
        MEMBER_CIRCULARS,
        MEMBER_CIRCULARS_PERIOD,
        NEWS,
        OPINIONS,
        REGULATIONS_UPDATED_AT,
        TAX_CALENDAR,
        TERRITORIAL_AGREEMENTS,
        TERRITORIAL_AGREEMENT_2020,
    } from "#lib/data/regulations.ts";
</script>

<svelte:head>
    <title>La normativa per gli immobili - Confedilizia Como</title>
    <meta
        name="description"
        content="Scadenzario tributario, novità, pareri, cedolare secca, contratti agevolati, interessi legali e imposta di registro."
    />
</svelte:head>

<PageHero
    title="La normativa per gli immobili"
    subtitle="aggiornata a {REGULATIONS_UPDATED_AT}"
/>

<div class="container divide-y pb-12">
    <PageSection id="scadenzario" title="Scadenzario tributario" description="A cura di Confedilizia.">
        <DocumentList links={TAX_CALENDAR} />
    </PageSection>

    <PageSection id="novita" title="Novità">
        <DocumentList links={NEWS} />
    </PageSection>

    <PageSection id="seminterrati" title="Recupero dei vani e locali seminterrati esistenti">
        <DocumentList links={BASEMENT_RECOVERY} />
    </PageSection>

    <PageSection id="pareri" title="I nostri pareri su condominio e locazioni">
        <DocumentList links={OPINIONS} />
    </PageSection>

    <PageSection id="riforma-condominio" title="Riforma del condominio">
        <DocumentList links={CONDOMINIUM_REFORM} />
        <p class="text-sm text-muted-foreground">{CONDOMINIUM_REFORM_NOTE}</p>
    </PageSection>

    <PageSection id="cedolare-secca" title="Cedolare secca">
        <DocumentList links={FLAT_TAX} />
        <p class="text-sm text-muted-foreground">{FLAT_TAX_NOTE}</p>
    </PageSection>

    <PageSection id="accordi-territoriali" title="Accordi territoriali e contratti agevolati">
        <Card.Root>
            <Card.Header>
                <Card.Title>{TERRITORIAL_AGREEMENT_2020.main.title}</Card.Title>
                <Card.Description>{TERRITORIAL_AGREEMENT_2020.main.description}</Card.Description>
            </Card.Header>
            <Card.Content class="gap-4">
                <Button
                    href={TERRITORIAL_AGREEMENT_2020.main.href}
                    target="_blank"
                    rel="noopener"
                    class="w-fit"
                >
                    <FileText />
                    Accordo
                </Button>
                <h3 class="font-medium">Allegati</h3>
                <ul class="flex flex-wrap gap-2">
                    {#each TERRITORIAL_AGREEMENT_2020.attachments as attachment}
                        <li>
                            <Button
                                href={attachment.href}
                                target="_blank"
                                rel="noopener"
                                variant="outline"
                                size="sm"
                            >
                                {attachment.title}
                            </Button>
                        </li>
                    {/each}
                </ul>
            </Card.Content>
        </Card.Root>
        <DocumentList links={TERRITORIAL_AGREEMENTS} />
    </PageSection>

    <PageSection id="circolari" title="Circolari ai soci" description={MEMBER_CIRCULARS_PERIOD}>
        <DocumentList links={MEMBER_CIRCULARS} />
        <Button href={CONTACTS.nationalWebsiteUrl} target="_blank" rel="noopener" variant="outline">
            <ExternalLink />
            Confedilizia - sito della sede nazionale di Roma
        </Button>
    </PageSection>

    <PageSection
        id="interessi-legali"
        title="Interessi legali"
        description="Dal 1942 ad oggi. Utili per l'integrazione di canoni e cauzioni."
    >
        <Card.Root class="max-w-md py-0">
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>In vigore dal</Table.Head>
                        <Table.Head class="text-right">Tasso</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each LEGAL_INTEREST_RATES as rate}
                        <Table.Row>
                            <Table.Cell>{rate.effectiveFrom}</Table.Cell>
                            <Table.Cell class="text-right font-medium">{rate.rate}</Table.Cell>
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>
        </Card.Root>
    </PageSection>

    <PageSection
        id="imposta-registro"
        title="Imposta di registro"
        description="Registrazione dei contratti di locazione."
    >
        <div class="grid gap-6 md:grid-cols-2">
            <Card.Root size="sm">
                <Card.Header>
                    <Card.Description>Imposta annuale</Card.Description>
                    <Card.Title class="text-3xl text-primary">{ANNUAL_TAX_RATE}</Card.Title>
                </Card.Header>
                <Card.Content class="text-sm text-muted-foreground">
                    <p>{ROUNDING_RULE.description}</p>
                    <ul>
                        {#each ROUNDING_RULE.examples as example}
                            <li>{example}</li>
                        {/each}
                    </ul>
                </Card.Content>
            </Card.Root>
            <Card.Root size="sm">
                <Card.Header>
                    <Card.Description>Imposta minima</Card.Description>
                    <Card.Title class="text-3xl text-primary">{MINIMUM_TAX}</Card.Title>
                </Card.Header>
                <Card.Content class="text-sm text-muted-foreground">
                    <p>{MINIMUM_TAX_NOTE}.</p>
                </Card.Content>
            </Card.Root>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
            <Card.Root class="py-0">
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.Head>Codice tributo</Table.Head>
                            <Table.Head>Descrizione</Table.Head>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {#each LEASE_TAX_CODES as tax}
                            <Table.Row>
                                <Table.Cell class="font-medium">{tax.code}</Table.Cell>
                                <Table.Cell>{tax.description}</Table.Cell>
                            </Table.Row>
                        {/each}
                    </Table.Body>
                </Table.Root>
            </Card.Root>
            <Card.Root class="py-0">
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.Head>Codice</Table.Head>
                            <Table.Head>Descrizione</Table.Head>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {#each REGISTRY_OFFICE_CODES as office}
                            <Table.Row>
                                <Table.Cell class="font-medium">{office.code}</Table.Cell>
                                <Table.Cell>{office.description}</Table.Cell>
                            </Table.Row>
                        {/each}
                    </Table.Body>
                </Table.Root>
            </Card.Root>
        </div>

        <Card.Root size="sm">
            <Card.Header>
                <Card.Title>{LOAN_FOR_USE.title}</Card.Title>
                <Card.Description>{LOAN_FOR_USE.note}</Card.Description>
            </Card.Header>
            <Card.Content>
                <p>Imposta fissa {LOAN_FOR_USE.fixedTax} - codice tributo {LOAN_FOR_USE.code}</p>
            </Card.Content>
        </Card.Root>
    </PageSection>

    <PageSection
        id="promemoria-contratti"
        title="Promemoria contratti di locazione"
        description="Promemoria delle formalità."
    >
        <Card.Root class="py-0">
            <Accordion.Root type="single" class="px-6">
                {#each LEASE_CHECKLIST as step}
                    <Accordion.Item value={step.id}>
                        <Accordion.Trigger>{step.title}</Accordion.Trigger>
                        <Accordion.Content>
                            <ul class="flex list-disc flex-col gap-1 pl-5">
                                {#each step.items as item}
                                    <li>{item}</li>
                                {/each}
                            </ul>
                            {#if step.note}
                                <p class="mt-2 text-muted-foreground">N.B. {step.note}</p>
                            {/if}
                        </Accordion.Content>
                    </Accordion.Item>
                {/each}
            </Accordion.Root>
        </Card.Root>
        <Alert.Root>
            <Info />
            <Alert.Description>{LEASE_CHECKLIST_NOTICE}</Alert.Description>
        </Alert.Root>
    </PageSection>
</div>
