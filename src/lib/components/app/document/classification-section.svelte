<script lang="ts">
    import { Badge } from "#lib/components/ui/badge/index.ts";
    import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import * as Select from "#lib/components/ui/select/index.ts";
    import { helpState } from "./help.svelte.ts";
    import LabelWithHelp from "./label-with-help.svelte";
    import { Switch } from "#lib/components/ui/switch/index.ts";
    import { Textarea } from "#lib/components/ui/textarea/index.ts";
    import { FASCIA_ORDER } from "#lib/accords/calculate.ts";
    import type { AccordDefinition, CalculationResult, Fascia } from "#lib/accords/types.ts";
    import type { DocumentData, DocumentKind } from "#lib/documents/types.ts";

    interface Props {
        kind: DocumentKind;
        accord: AccordDefinition;
        data: DocumentData;
        result: CalculationResult;
    }

    let { kind, accord, data = $bindable(), result }: Props = $props();

    const FASCIA_LABELS: Record<Fascia, string> = {
        minima: "Fascia minima",
        media: "Fascia media",
        massima: "Fascia massima",
    };

    const classification = $derived(result.classification);
    const thresholds = $derived(
        classification ? accord.thresholds[classification.sizeBand][classification.floorBand] : null,
    );

    const AUTOMATIC = "auto";

    const NO_BATHROOM_HELP =
        "In assenza di servizi igienici interni si applica sempre la fascia minima e il canone massimo è il minimo aumentato del 5%.";
    const OVERRIDE_HELP =
        "La fascia massima vale per immobili in ottimo stato di manutenzione, la media in normale stato. Se l'immobile non è in queste condizioni scegli la fascia inferiore e spiegalo nelle note.";
    const NOTES_HELP = "Compaiono nell'attestazione, sotto la fascia di appartenenza. Facoltative.";

    // The fascia can only be lowered, e.g. when the apartment is not in the state of maintenance the higher fascia needs.
    const lowerFasce = $derived(
        classification ? FASCIA_ORDER.filter((fascia) => FASCIA_ORDER.indexOf(fascia) < FASCIA_ORDER.indexOf(classification.automaticFascia)) : [],
    );

    const toggleParameter = (number: number, isChecked: boolean) => {
        const others = data.calculation.parameters.filter((value) => value !== number);
        data.calculation.parameters = isChecked ? [...others, number] : others;
    };
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Elementi oggettivi di classificazione</Card.Title>
        {#if helpState.showAll}
            <Card.Description>
                Seleziona gli elementi presenti e usufruibili dal conduttore. Dal numero di elementi, dalla superficie
                calpestabile e dal piano dipende la fascia (minima, media, massima).
            </Card.Description>
        {/if}
    </Card.Header>
    <Card.Content>
        <Field.Group>
            {#each [{ title: "Parametri da 1 a 7", parameters: accord.coreParameters }, { title: "Parametri da 8 a 13", parameters: accord.extraParameters }] as group}
                <Field.Set>
                    <Field.Legend variant="label">{group.title}</Field.Legend>
                    <div class="grid gap-3 md:grid-cols-2">
                        {#each group.parameters as parameter (parameter.number)}
                            <Field.Field orientation="horizontal">
                                <Checkbox
                                    id="parameter-{parameter.number}"
                                    checked={data.calculation.parameters.includes(parameter.number)}
                                    onCheckedChange={(isChecked) => toggleParameter(parameter.number, isChecked)}
                                />
                                <Field.Label for="parameter-{parameter.number}" class="font-normal">
                                    <span class="font-medium">{parameter.number}.</span>
                                    {parameter.label}
                                </Field.Label>
                            </Field.Field>
                        {/each}
                    </div>
                </Field.Set>
            {/each}

            <Field.Field orientation="horizontal">
                <Switch id="no-indoor-bathroom" bind:checked={data.calculation.noIndoorBathroom} />
                <Field.Content>
                    <LabelWithHelp for="no-indoor-bathroom" help={NO_BATHROOM_HELP}>
                        {accord.noIndoorBathroomLabel}
                    </LabelWithHelp>
                </Field.Content>
            </Field.Field>
            {#if kind === "attestation"}
                {#if lowerFasce.length > 0 && classification}
                    <Field.Field>
                        <LabelWithHelp for="fascia-override" help={OVERRIDE_HELP}>Fascia applicata</LabelWithHelp>
                        <Select.Root
                            type="single"
                            value={data.calculation.fasciaOverride ?? AUTOMATIC}
                            onValueChange={(value) => (data.calculation.fasciaOverride = value === AUTOMATIC ? null : (value as Fascia))}
                        >
                            <Select.Trigger id="fascia-override" class="w-full sm:w-96">
                                {data.calculation.fasciaOverride
                                    ? FASCIA_LABELS[data.calculation.fasciaOverride]
                                    : `Quella dei parametri (${FASCIA_LABELS[classification.automaticFascia].toLowerCase()})`}
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value={AUTOMATIC} label="Quella dei parametri">
                                    Quella dei parametri ({FASCIA_LABELS[classification.automaticFascia].toLowerCase()})
                                </Select.Item>
                                {#each lowerFasce as fascia}
                                    <Select.Item value={fascia} label={FASCIA_LABELS[fascia]}>
                                        {FASCIA_LABELS[fascia]}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </Field.Field>
                {/if}
                <Field.Field>
                    <LabelWithHelp for="fascia-notes" help={NOTES_HELP}>Note sulla fascia</LabelWithHelp>
                    <Textarea
                        id="fascia-notes"
                        rows={3}
                        maxlength={800}
                        placeholder="Es. immobile in normale stato di manutenzione: applicata la fascia media."
                        bind:value={data.details.fasciaNotes}
                    />
                </Field.Field>
            {/if}
        </Field.Group>
    </Card.Content>
    {#if classification && thresholds}
        <Card.Footer class="flex-col items-start gap-2 border-t text-sm">
            <div class="flex flex-wrap items-center gap-2">
                <Badge>{FASCIA_LABELS[classification.fascia]}</Badge>
                <span class="text-muted-foreground">
                    {classification.coreCount} parametri su 7, {classification.extraCount} su 6
                    (totale {classification.totalCount} su 13).
                </span>
            </div>
            {#if helpState.showAll}
            <p class="text-muted-foreground">
                Per questo immobile ({classification.floorBand === "low" ? "fino al 3° piano" : "dal 4° piano"},
                {classification.sizeBand === "small"
                    ? "meno di 60 mq"
                    : classification.sizeBand === "medium"
                      ? "da 60 a 100 mq"
                      : "oltre 100 mq"}
                calpestabili): fascia massima con almeno {thresholds.maximumCore} parametri tra i primi 7 e 1 tra
                8 e 13; fascia media con almeno {thresholds.mediumTotal} parametri su 13.
            </p>
            {/if}
        </Card.Footer>
    {/if}
</Card.Root>
