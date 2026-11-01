<script lang="ts">
    import { FileText } from "@lucide/svelte";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import ContactCard from "#lib/components/site/contact-card.svelte";
    import PageHero from "#lib/components/site/page-hero.svelte";
    import PageSection from "#lib/components/site/page-section.svelte";
    import TrainingCard from "#lib/components/site/training-card.svelte";
    import { CONTACTS } from "#lib/contacts.ts";
    import { pdf } from "#lib/data/types.ts";
</script>

<svelte:head>
    <title>Confedilizia Como - Associazione della Proprietà Edilizia</title>
    <meta
        name="description"
        content="Associazione della Proprietà Edilizia a Como, associazione tra proprietari di case dal 1908."
    />
</svelte:head>

<PageHero title="Associazione della Proprietà Edilizia" subtitle={CONTACTS.slogan} />

<div class="container divide-y pb-12">
    <PageSection id="formazione" title="Corsi di formazione">
        <TrainingCard>
            <Button href="/registro-amministratori" variant="outline" class="w-fit">
                Registro amministratori
            </Button>
        </TrainingCard>
    </PageSection>

    <PageSection id="contatti" title="Contatti e orari">
        <div class="grid items-start gap-6 md:grid-cols-2">
            <ContactCard />
            <Card.Root>
                <Card.Header>
                    <Card.Title>Iscrizione all'associazione</Card.Title>
                    <Card.Description>
                        Scarica il modulo di iscrizione oppure seguici sui social.
                    </Card.Description>
                </Card.Header>
                <Card.Content class="flex-row flex-wrap gap-3">
                    <Button href={pdf("ModuloiscrizioneAPE.pdf")} target="_blank" rel="noopener">
                        <FileText />
                        Modulo di iscrizione
                    </Button>
                    <Button
                        href={CONTACTS.facebookUrl}
                        target="_blank"
                        rel="noopener"
                        variant="outline"
                    >
                        Facebook
                    </Button>
                </Card.Content>
            </Card.Root>
        </div>
    </PageSection>

    <PageSection id="storia" title="Storia e scopo dell'associazione">
        <div class="grid items-start gap-8 lg:grid-cols-5">
            <div class="space-y-4 leading-relaxed lg:col-span-3">
                <p>
                    L'Associazione della Proprietà Edilizia di Como è tra le più antiche d'Italia,
                    una delle più attive a livello nazionale e parte integrante della Confedilizia,
                    l'organizzazione storica italiana dei proprietari di case.
                </p>
                <p>
                    Costituita il 17 dicembre 1908, con atto del notaio Carlo Capiaghi di Como, con
                    la denominazione «Società Comense fra i proprietari di case», diventa nel 1917
                    «Associazione fra i Proprietari di case di Como», nel 1926 si cambia in
                    «Associazione Proprietari di case di Como» ed è infine rifondata, nel 1963, come
                    «Associazione della Proprietà Edilizia».
                </p>
                <p>
                    L'associazione nasce con lo scopo di difendere i principi liberistici e
                    costituzionali della proprietà e del risparmio dal punto di vista economico,
                    sociale, etico e civile.
                </p>
                <p>
                    Da sempre l'attività è intensa e costante nell'intento di contenere gli attacchi,
                    anche di indiscriminati atti legislativi, al bene «casa».
                </p>
                <p>
                    L'associazione fornisce consulenza ed assistenza ai propri associati in materia
                    immobiliare, oltre ad un servizio di conciliazione per liti condominiali e
                    locatizie.
                </p>
                <p>{CONTACTS.openingHours}</p>
            </div>
            <figure class="lg:col-span-2">
                <img
                    src="/images/assemblea-soci-2019.jpg"
                    alt="Assemblea dei soci del 20 giugno 2019"
                    width="500"
                    height="375"
                    class="w-full rounded-xl"
                />
                <figcaption class="mt-2 text-sm text-muted-foreground">
                    Assemblea dei soci del 20 giugno 2019. Presidente Avv. Bocchietti e
                    vicepresidente Avv. Sollazzo.
                </figcaption>
            </figure>
        </div>
    </PageSection>
</div>
