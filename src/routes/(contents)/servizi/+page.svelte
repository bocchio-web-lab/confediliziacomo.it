<script lang="ts">
    import { Landmark } from "@lucide/svelte";

    import { Badge } from "#lib/components/ui/badge/index.ts";
    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Alert from "#lib/components/ui/alert/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import CheckList from "#lib/components/site/check-list.svelte";
    import ContactCard from "#lib/components/site/contact-card.svelte";
    import PageHero from "#lib/components/site/page-hero.svelte";
    import PageSection from "#lib/components/site/page-section.svelte";
    import PricedTable from "#lib/components/site/priced-table.svelte";
    import {
        AGREED_RENT_NOTES,
        BANK_DETAILS,
        EXTERNAL_SERVICES,
        MEETING_ROOM,
        MEMBERSHIP_FEES,
        MEMBERSHIP_FEES_YEAR,
        MEMBERSHIP_NOTES,
        MEMBER_SERVICES,
        MEMBER_SERVICES_LINKS,
        NON_MEMBER_RATES,
        PAID_SERVICES,
    } from "#lib/data/services.ts";
</script>

<svelte:head>
    <title>Servizi e quote associative - Confedilizia Como</title>
    <meta
        name="description"
        content="Servizi gratuiti per i soci, diritti di segreteria, tariffe per i non soci e quote associative di Confedilizia Como."
    />
</svelte:head>

<PageHero title="I servizi dell'associazione" subtitle="e le quote associative" />

<div class="container divide-y pb-12">
    <div class="py-10">
        <ContactCard />
    </div>

    <PageSection
        id="servizi-soci"
        title="Servizi gratuiti per i soci"
        description="L'iscrizione all'Associazione della Proprietà Edilizia di Como dà diritto ai seguenti servizi gratuiti."
    >
        <Card.Root>
            <Card.Content>
                <CheckList items={MEMBER_SERVICES} />
            </Card.Content>
            <Card.Footer class="flex-wrap gap-3">
                {#each MEMBER_SERVICES_LINKS as link}
                    <Button href={link.href} variant="outline">{link.title}</Button>
                {/each}
            </Card.Footer>
        </Card.Root>
    </PageSection>

    <PageSection
        id="servizi-a-pagamento"
        title="Altri servizi con diritti di segreteria"
        description="Servizi ulteriori rispetto alla quota associativa."
    >
        <PricedTable items={PAID_SERVICES} />
    </PageSection>

    <PageSection id="tariffe-non-soci" title="Tariffe per i non soci">
        <PricedTable items={NON_MEMBER_RATES} />
        <div class="grid gap-6 md:grid-cols-2">
            {#each AGREED_RENT_NOTES as note}
                <Card.Root size="sm">
                    <Card.Header>
                        <Card.Title>Canone concordato: {note.audience.toLowerCase()}</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <ul class="flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
                            {#each note.items as item}
                                <li>{item}</li>
                            {/each}
                        </ul>
                    </Card.Content>
                </Card.Root>
            {/each}
        </div>
    </PageSection>

    <PageSection id="sala-assemblee" title="Sala per piccole assemblee">
        <Card.Root>
            <Card.Header>
                <Card.Title>Disponibile per i soci</Card.Title>
                <Card.Description>
                    <Badge variant="secondary">Massimo {MEETING_ROOM.capacity} persone</Badge>
                </Card.Description>
            </Card.Header>
            <Card.Content>
                {#each MEETING_ROOM.details as paragraph}
                    <p>{paragraph}</p>
                {/each}
            </Card.Content>
        </Card.Root>
    </PageSection>

    <PageSection
        id="servizi-esterni"
        title="Servizi di professionisti esterni"
        description="Coordinamento per i seguenti ulteriori servizi, per soli soci, prestati da professionisti esterni."
    >
        <Card.Root>
            <Card.Content>
                <CheckList items={EXTERNAL_SERVICES} />
            </Card.Content>
        </Card.Root>
    </PageSection>

    <PageSection
        id="quote-associative"
        title="Quote associative"
        description="Quote in vigore dal {MEMBERSHIP_FEES_YEAR}."
    >
        <div class="grid gap-6 md:grid-cols-3">
            {#each MEMBERSHIP_FEES as fee}
                <Card.Root>
                    <Card.Header>
                        <Card.Description>{fee.label}</Card.Description>
                        <Card.Title class="text-3xl text-primary">{fee.price}</Card.Title>
                    </Card.Header>
                </Card.Root>
            {/each}
        </div>
        <Alert.Root>
            <Landmark />
            <Alert.Title>Le quote possono essere versate su {BANK_DETAILS.bank}</Alert.Title>
            <Alert.Description>IBAN: {BANK_DETAILS.iban}</Alert.Description>
        </Alert.Root>
        <ul class="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
            {#each MEMBERSHIP_NOTES as note}
                <li>{note}</li>
            {/each}
        </ul>
    </PageSection>
</div>
