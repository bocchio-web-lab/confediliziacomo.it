<script lang="ts">
    import * as Card from "#lib/components/ui/card/index.ts";
    import { helpState } from "./help.svelte.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Switch } from "#lib/components/ui/switch/index.ts";
    import type { Territory } from "#lib/accords/types.ts";
    import type { DocumentData } from "#lib/documents/types.ts";
    import NumberField from "./number-field.svelte";
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
                compilare a mano.
            </Card.Description>
        {/if}
    </Card.Header>
    <Card.Content>
        <Field.Group>
            <Field.Set>
                <Field.Legend variant="label">Locatore</Field.Legend>
                <div class="grid gap-4 sm:grid-cols-3">
                    <TextField id="landlord-name" label="Nome e cognome" bind:value={data.details.landlord.name} />
                    {#if isProvince}
                        <TextField id="landlord-birth-place" label="Nato a" bind:value={data.details.landlord.birthPlace} />
                        <TextField id="landlord-birth-date" type="date" label="Nato il" bind:value={data.details.landlord.birthDate} />
                    {/if}
                    <TextField id="landlord-tax-code" label="Codice fiscale" bind:value={data.details.landlord.taxCode} />
                    <TextField
                        id="landlord-residence"
                        label="Residenza"
                        placeholder={isProvince ? "Comune, CAP, via e numero" : undefined}
                        bind:value={data.details.landlord.residence}
                    />
                </div>
            </Field.Set>
            <Field.Set>
                <Field.Legend variant="label">Conduttore</Field.Legend>
                <div class="grid gap-4 sm:grid-cols-3">
                    <TextField id="tenant-name" label="Nome e cognome" bind:value={data.details.tenant.name} />
                    {#if isProvince}
                        <TextField id="tenant-birth-place" label="Nato a" bind:value={data.details.tenant.birthPlace} />
                        <TextField id="tenant-birth-date" type="date" label="Nato il" bind:value={data.details.tenant.birthDate} />
                    {/if}
                    <TextField id="tenant-tax-code" label="Codice fiscale" bind:value={data.details.tenant.taxCode} />
                    <TextField
                        id="tenant-residence"
                        label="Residenza"
                        placeholder={isProvince ? "Comune, CAP, via e numero" : undefined}
                        bind:value={data.details.tenant.residence}
                    />
                </div>
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
