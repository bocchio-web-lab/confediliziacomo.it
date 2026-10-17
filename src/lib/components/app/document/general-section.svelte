<script lang="ts">
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import * as Select from "#lib/components/ui/select/index.ts";
    import type { AccordDefinition } from "#lib/accords/types.ts";
    import type { DocumentData } from "#lib/documents/types.ts";
    import NumberField from "./number-field.svelte";
    import TextField from "./text-field.svelte";

    interface Props {
        accord: AccordDefinition;
        data: DocumentData;
    }

    let { accord, data = $bindable() }: Props = $props();

    const zoneLabel = $derived(accord.zones.find((zone) => zone.value === data.calculation.zone)?.label);
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Dati generali</Card.Title>
        <Card.Description>
            Unità abitativa sita a Como o in provincia, con i dati che compaiono nell'intestazione del documento.
        </Card.Description>
    </Card.Header>
    <Card.Content>
        <Field.Group>
            <div class="grid gap-4 sm:grid-cols-2">
                <TextField
                    id="contract-date"
                    type="date"
                    label="Data di stipula del contratto"
                    bind:value={data.calculation.contractDate}
                    description="Determina l'accordo territoriale applicabile e l'indice ISTAT."
                    required
                />
                <TextField
                    id="number"
                    label="Numero (N.)"
                    placeholder="Facoltativo"
                    bind:value={data.details.number}
                />
            </div>
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
                        {#if accord.zoneHelp}
                            <Field.Description>
                                {accord.zoneHelp.text}
                                {#each accord.zoneHelp.links as link, index}
                                    {index > 0 ? " · " : ""}<a
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener"
                                        class="underline">{link.label}</a
                                    >
                                {/each}
                            </Field.Description>
                        {/if}
                    </Field.Field>
                {/if}
            </div>
            <TextField
                id="issue-date"
                type="date"
                label="Data del documento («Como, lì»)"
                bind:value={data.details.issueDate}
                description="Lasciala vuota per stampare una riga da compilare a mano."
            />
        </Field.Group>
    </Card.Content>
</Card.Root>
