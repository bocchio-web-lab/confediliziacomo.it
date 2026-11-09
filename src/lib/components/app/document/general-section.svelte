<script lang="ts">
    import * as Card from "#lib/components/ui/card/index.ts";
    import { helpState } from "./help.svelte.ts";
    import LabelWithHelp from "./label-with-help.svelte";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Input } from "#lib/components/ui/input/index.ts";
    import * as Select from "#lib/components/ui/select/index.ts";
    import type { AccordDefinition, Territory } from "#lib/accords/types.ts";
    import { LEASE_TYPES, type DocumentData, type DocumentKind, type LeaseType } from "#lib/documents/types.ts";
    import NumberField from "./number-field.svelte";
    import TextField from "./text-field.svelte";

    interface Props {
        kind: DocumentKind;
        territory: Territory;
        accord: AccordDefinition;
        data: DocumentData;
        /** Number the new document will get. Only present when the document is not saved yet. */
        nextNumber?: number;
    }

    let { kind, territory, accord, data = $bindable(), nextNumber }: Props = $props();

    // Only the attestations of the Provincia are made for more than one kind of lease.
    const hasLeaseTypes = $derived(kind === "attestation" && territory === "province");

    const NUMBER_HELP =
        "Lascialo vuoto: viene assegnato il numero progressivo successivo. Scrivilo solo per inserire un documento già numerato in precedenza.";

    // A manual number this far ahead of the next one is probably a typo.
    const MANY_NUMBERS_AHEAD = 20;

    const zoneLabel = $derived(accord.zones.find((zone) => zone.value === data.calculation.zone)?.label);
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Dati generali</Card.Title>
        {#if helpState.showAll}
            <Card.Description>
                {#if kind === "prospectus"}
                    Dati dell'unità abitativa e di chi richiede il prospetto.
                {:else}
                    Dati dell'unità abitativa e date del contratto.
                {/if}
            </Card.Description>
        {/if}
    </Card.Header>
    <Card.Content>
        <Field.Group>
            <div class="grid gap-4 sm:grid-cols-2">
                {#if kind === "prospectus"}
                    <TextField
                        id="document-date"
                        type="date"
                        label="Data del prospetto"
                        bind:value={data.calculation.contractDate}
                        description="Determina l'accordo territoriale applicabile e l'indice ISTAT. È la data stampata sul prospetto."
                        required
                    />
                {:else}
                    <TextField
                        id="contract-date"
                        type="date"
                        label="Data di stipula del contratto"
                        bind:value={data.calculation.contractDate}
                        description="Determina l'accordo territoriale applicabile e l'indice ISTAT."
                        required
                    />
                {/if}

                {#if nextNumber !== undefined}
                    <Field.Field>
                        <LabelWithHelp for="requested-number" help={NUMBER_HELP}>Numero del documento</LabelWithHelp>
                        <Input
                            id="requested-number"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Automatico (prossimo: {nextNumber})"
                            value={data.requestedNumber ?? ""}
                            oninput={(event) => (data.requestedNumber = event.currentTarget.valueAsNumber || null)}
                        />
                        {#if data.requestedNumber !== null && data.requestedNumber > nextNumber + MANY_NUMBERS_AHEAD}
                            <Field.Description class="font-medium text-destructive">
                                Il numero è molto più alto del prossimo ({nextNumber}): i documenti successivi
                                continueranno da qui. Controlla di non aver sbagliato.
                            </Field.Description>
                        {/if}
                    </Field.Field>
                {/if}
            </div>

            {#if hasLeaseTypes}
                <Field.Field>
                    <Field.Label for="lease-type">Tipo di contratto</Field.Label>
                    <Select.Root
                        type="single"
                        value={data.details.leaseType}
                        onValueChange={(value) => (data.details.leaseType = value as LeaseType)}
                    >
                        <Select.Trigger id="lease-type" class="w-full">{LEASE_TYPES[data.details.leaseType].label}</Select.Trigger>
                        <Select.Content>
                            {#each Object.entries(LEASE_TYPES) as [value, type]}
                                <Select.Item {value} label={type.label}>{type.label}</Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                    <Field.Description>
                        {#if LEASE_TYPES[data.details.leaseType].hasBoundRent}
                            Il canone resta nelle fasce dell'accordo: l'attestazione ne verifica la conformità e allega il prospetto di
                            conteggio.
                        {:else}
                            Il canone è libero: l'attestazione riguarda solo la conformità normativa, senza calcolo.
                        {/if}
                    </Field.Description>
                </Field.Field>
            {/if}

            {#if kind === "prospectus"}
                <TextField
                    id="applicant-name"
                    label="Richiedente (locatore)"
                    placeholder="Nome e cognome"
                    bind:value={data.details.landlord.name}
                    description="Serve per ritrovare il prospetto nell'elenco."
                />
            {:else}
                <TextField
                    id="issue-date"
                    type="date"
                    label="Data del documento («Como, lì»)"
                    bind:value={data.details.issueDate}
                    description="Lasciala vuota per stampare una riga da compilare a mano."
                />
            {/if}

            <div class="grid gap-4 sm:grid-cols-3">
                <div class="sm:col-span-2">
                    <TextField
                        id="address"
                        label="Indirizzo (via/piazza, numero civico e comune)"
                        placeholder="Via Roma 1, Como"
                        bind:value={data.details.address}
                    />
                </div>
                <TextField id="unit" label="Interno" bind:value={data.details.unit} />
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
                <NumberField
                    id="floor"
                    label="Piano"
                    bind:value={data.calculation.floor}
                    blankZero={false}
                    description="Piano terra = 0, primo piano = 1, ... Dal quarto piano in su le soglie di classificazione sono più alte."
                />
                {#if accord.zones.length > 0}
                    <Field.Field>
                        <Field.Label for="zone">Microzona</Field.Label>
                        <Select.Root
                            type="single"
                            value={data.calculation.zone === null ? "" : String(data.calculation.zone)}
                            onValueChange={(value) => (data.calculation.zone = value ? Number(value) : null)}
                        >
                            <Select.Trigger id="zone" class="w-full">
                                {zoneLabel ?? "Seleziona la microzona"}
                            </Select.Trigger>
                            <Select.Content>
                                {#each accord.zones as zone}
                                    <Select.Item value={String(zone.value)} label={zone.label}>
                                        {zone.label}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                        {#if accord.zoneLinks.length > 0}
                            <p class="text-sm text-muted-foreground">
                                {#each accord.zoneLinks as link, index}
                                    {index > 0 ? " · " : ""}<a
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener"
                                        class="underline">{link.label}</a
                                    >
                                {/each}
                            </p>
                        {/if}
                    </Field.Field>
                {/if}
            </div>
        </Field.Group>
    </Card.Content>
</Card.Root>
