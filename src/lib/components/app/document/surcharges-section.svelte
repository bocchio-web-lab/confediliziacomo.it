<script lang="ts">
    import * as Card from "#lib/components/ui/card/index.ts";
    import { helpState } from "./help.svelte.ts";
    import LabelWithHelp from "./label-with-help.svelte";
    import * as Field from "#lib/components/ui/field/index.ts";
    import * as Select from "#lib/components/ui/select/index.ts";
    import { Switch } from "#lib/components/ui/switch/index.ts";
    import { NET_SURFACE_ID } from "#lib/accords/calculate.ts";
    import type { AccordDefinition, SurchargeContext } from "#lib/accords/types.ts";
    import type { DocumentData } from "#lib/documents/types.ts";
    import NumberField from "./number-field.svelte";

    interface Props {
        accord: AccordDefinition;
        data: DocumentData;
    }

    let { accord, data = $bindable() }: Props = $props();

    const context = $derived<SurchargeContext>({ netSurface: data.calculation.surfaces[NET_SURFACE_ID] || 0 });
    const surcharges = $derived(data.calculation.surcharges);
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Elementi di maggiorazione / riduzione</Card.Title>
        {#if helpState.showAll}
            <Card.Description>
                Le variazioni si applicano ai canoni minimi e massimi per l'intera durata del contratto e si sommano tra
                loro.
            </Card.Description>
        {/if}
    </Card.Header>
    <Card.Content>
        <Field.Group>
            {#each accord.surcharges as definition (definition.id)}
                {@const isAvailable = definition.kind === "select" || (definition.isAvailable?.(context) ?? true)}
                {#if definition.kind === "select"}
                    {@const selected = definition.options.find((option) => option.value === surcharges[definition.id])}
                    <Field.Field>
                        <LabelWithHelp for="surcharge-{definition.id}" help={definition.description}>
                            {definition.label}
                        </LabelWithHelp>
                        <Select.Root
                            type="single"
                            value={String(surcharges[definition.id] ?? "")}
                            onValueChange={(value) => (surcharges[definition.id] = value)}
                        >
                            <Select.Trigger id="surcharge-{definition.id}" class="w-full sm:w-72">
                                {selected?.label ?? "Seleziona"}
                            </Select.Trigger>
                            <Select.Content>
                                {#each definition.options as option}
                                    <Select.Item value={option.value} label={option.label}>
                                        {option.label}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </Field.Field>
                {:else if definition.kind === "toggle"}
                    <Field.Field orientation="horizontal">
                        <Switch
                            id="surcharge-{definition.id}"
                            disabled={!isAvailable}
                            checked={surcharges[definition.id] === true}
                            onCheckedChange={(isChecked) => (surcharges[definition.id] = isChecked)}
                        />
                        <Field.Content>
                            <LabelWithHelp for="surcharge-{definition.id}" help={definition.description}>
                                {definition.label}
                            </LabelWithHelp>
                            {#if !isAvailable}
                                <p class="text-sm text-muted-foreground">{definition.unavailableReason}</p>
                            {/if}
                        </Field.Content>
                    </Field.Field>
                {:else}
                    {@const percent = typeof surcharges[definition.id] === "number" ? (surcharges[definition.id] as number) : 0}
                    <Field.Field>
                        <div class="flex items-start gap-3">
                            <Switch
                                id="surcharge-{definition.id}"
                                class="mt-0.5"
                                disabled={!isAvailable}
                                checked={percent > 0}
                                onCheckedChange={(isChecked) => (surcharges[definition.id] = isChecked ? definition.maxPercent : 0)}
                            />
                            <div class="flex-1 space-y-1">
                                <LabelWithHelp for="surcharge-{definition.id}" help={definition.description}>
                                    {definition.label}
                                </LabelWithHelp>
                                {#if !isAvailable}
                                    <p class="text-sm text-muted-foreground">{definition.unavailableReason}</p>
                                {/if}
                            </div>
                        </div>
                        {#if percent > 0}
                            <div class="sm:w-48 sm:pl-12">
                                <NumberField
                                    id="surcharge-{definition.id}-percent"
                                    label="Percentuale applicata"
                                    unit="%"
                                    max={definition.maxPercent}
                                    bind:value={() => percent, (value) => (surcharges[definition.id] = value)}
                                />
                            </div>
                        {/if}
                    </Field.Field>
                {/if}
            {/each}
        </Field.Group>
    </Card.Content>
</Card.Root>
