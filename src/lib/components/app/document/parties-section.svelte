<script lang="ts">
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Switch } from "#lib/components/ui/switch/index.ts";
    import type { DocumentData } from "#lib/documents/types.ts";
    import NumberField from "./number-field.svelte";
    import TextField from "./text-field.svelte";

    interface Props {
        data: DocumentData;
    }

    let { data = $bindable() }: Props = $props();
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Locatore e conduttore</Card.Title>
        <Card.Description>
            Dati che compaiono nelle premesse dell'attestazione. I campi lasciati vuoti vengono stampati come righe da
            compilare a mano.
        </Card.Description>
    </Card.Header>
    <Card.Content>
        <Field.Group>
            <Field.Set>
                <Field.Legend variant="label">Locatore</Field.Legend>
                <div class="grid gap-4 sm:grid-cols-3">
                    <TextField id="landlord-name" label="Nome e cognome" bind:value={data.details.landlord.name} />
                    <TextField id="landlord-tax-code" label="Codice fiscale" bind:value={data.details.landlord.taxCode} />
                    <TextField id="landlord-residence" label="Residenza" bind:value={data.details.landlord.residence} />
                </div>
            </Field.Set>
            <Field.Set>
                <Field.Legend variant="label">Conduttore</Field.Legend>
                <div class="grid gap-4 sm:grid-cols-3">
                    <TextField id="tenant-name" label="Nome e cognome" bind:value={data.details.tenant.name} />
                    <TextField id="tenant-tax-code" label="Codice fiscale" bind:value={data.details.tenant.taxCode} />
                    <TextField id="tenant-residence" label="Residenza" bind:value={data.details.tenant.residence} />
                </div>
            </Field.Set>
        </Field.Group>
    </Card.Content>
</Card.Root>

<Card.Root>
    <Card.Header>
        <Card.Title>Contratto e canone convenuto</Card.Title>
        <Card.Description>
            Il canone annuo convenuto viene confrontato con le fasce dell'accordo per verificarne la conformità.
        </Card.Description>
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
                        label="presso l'Agenzia delle Entrate di"
                        bind:value={data.details.registration.office}
                    />
                </div>
            {/if}
        </Field.Group>
    </Card.Content>
</Card.Root>
