<script lang="ts">
    import { Plus, Trash2 } from "@lucide/svelte";
    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import { helpState } from "./help.svelte.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Switch } from "#lib/components/ui/switch/index.ts";
    import type { Territory } from "#lib/accords/types.ts";
    import { MAX_ADDITIONAL_PARTIES, emptyParty, type DocumentData } from "#lib/documents/types.ts";
    import NumberField from "./number-field.svelte";
    import PartyFields from "./party-fields.svelte";
    import TextField from "./text-field.svelte";

    interface Props {
        territory: Territory;
        /** False when the rent is free: it is not compared with the accord. */
        hasRates: boolean;
        data: DocumentData;
    }

    let { territory, hasRates, data = $bindable() }: Props = $props();

    // The attestation of the Provincia also prints where and when the parties were born.
    const isProvince = $derived(territory === "province");
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Locatore e conduttore</Card.Title>
        {#if helpState.showAll}
            <Card.Description>
                Dati che compaiono nelle premesse dell'attestazione. I campi lasciati vuoti vengono stampati come righe da
                compilare a mano. Se i locatori o i conduttori sono più d'uno, aggiungili: compaiono tutti nelle premesse.
            </Card.Description>
        {/if}
    </Card.Header>
    <Card.Content>
        <Field.Group>
            <Field.Set>
                <Field.Legend variant="label">Locatore</Field.Legend>
                <PartyFields id="landlord" bind:party={data.details.landlord} withBirth={isProvince} />
                {#each data.details.additionalLandlords as _, index}
                    <div class="space-y-2 border-t pt-4">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium">Locatore {index + 2}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onclick={() => data.details.additionalLandlords.splice(index, 1)}
                            >
                                <Trash2 />
                                Rimuovi
                            </Button>
                        </div>
                        <PartyFields
                            id="landlord-{index + 2}"
                            bind:party={data.details.additionalLandlords[index]}
                            withBirth={isProvince}
                        />
                    </div>
                {/each}
                {#if data.details.additionalLandlords.length < MAX_ADDITIONAL_PARTIES}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        class="w-fit"
                        onclick={() => data.details.additionalLandlords.push(emptyParty())}
                    >
                        <Plus />
                        Aggiungi un altro locatore
                    </Button>
                {/if}
            </Field.Set>
            <Field.Set>
                <Field.Legend variant="label">Conduttore</Field.Legend>
                <PartyFields id="tenant" bind:party={data.details.tenant} withBirth={isProvince} />
                {#each data.details.additionalTenants as _, index}
                    <div class="space-y-2 border-t pt-4">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium">Conduttore {index + 2}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onclick={() => data.details.additionalTenants.splice(index, 1)}
                            >
                                <Trash2 />
                                Rimuovi
                            </Button>
                        </div>
                        <PartyFields
                            id="tenant-{index + 2}"
                            bind:party={data.details.additionalTenants[index]}
                            withBirth={isProvince}
                        />
                    </div>
                {/each}
                {#if data.details.additionalTenants.length < MAX_ADDITIONAL_PARTIES}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        class="w-fit"
                        onclick={() => data.details.additionalTenants.push(emptyParty())}
                    >
                        <Plus />
                        Aggiungi un altro conduttore
                    </Button>
                {/if}
            </Field.Set>
        </Field.Group>
    </Card.Content>
</Card.Root>

<Card.Root>
    <Card.Header>
        <Card.Title>Contratto e canone convenuto</Card.Title>
        {#if helpState.showAll}
            <Card.Description>
                {#if hasRates}
                    Il canone annuo convenuto viene confrontato con le fasce dell'accordo per verificarne la conformità.
                {:else}
                    Il canone è libero: viene solo stampato nell'attestazione, senza confronto con le fasce.
                {/if}
            </Card.Description>
        {/if}
    </Card.Header>
    <Card.Content>
        <Field.Group>
            <div class="grid gap-4 sm:grid-cols-2">
                <TextField
                    id="lease-start"
                    type="date"
                    label="Decorrenza del contratto"
                    bind:value={data.details.leaseStartDate}
                />
                <NumberField
                    id="agreed-rent"
                    label="Canone annuo convenuto"
                    unit="€"
                    bind:value={data.details.agreedAnnualRent}
                />
            </div>

            <Field.Field orientation="horizontal">
                <Switch id="registration-pending" bind:checked={data.details.registration.isPending} />
                <Field.Content>
                    <Field.Label for="registration-pending">Contratto in corso di registrazione</Field.Label>
                    <Field.Description>I termini di registrazione non sono ancora scaduti.</Field.Description>
                </Field.Content>
            </Field.Field>

            {#if !data.details.registration.isPending}
                <div class="grid gap-4 sm:grid-cols-3">
                    <TextField
                        id="registration-date"
                        type="date"
                        label="Registrato il"
                        bind:value={data.details.registration.date}
                    />
                    <TextField id="registration-number" label="al numero" bind:value={data.details.registration.number} />
                    <TextField
                        id="registration-office"
                        label={isProvince ? "presso l'Ufficio Territoriale di" : "presso l'Agenzia delle Entrate di"}
                        bind:value={data.details.registration.office}
                    />
                </div>
            {/if}
        </Field.Group>
    </Card.Content>
</Card.Root>
