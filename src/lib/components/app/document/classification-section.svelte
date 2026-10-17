<script lang="ts">
    import { Badge } from "#lib/components/ui/badge/index.ts";
    import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Switch } from "#lib/components/ui/switch/index.ts";
    import type { AccordDefinition, CalculationResult, Fascia } from "#lib/accords/types.ts";
    import type { DocumentData } from "#lib/documents/types.ts";

    interface Props {
        accord: AccordDefinition;
        data: DocumentData;
        result: CalculationResult;
    }

    let { accord, data = $bindable(), result }: Props = $props();

    const FASCIA_LABELS: Record<Fascia, string> = {
        minima: "Fascia minima",
        media: "Fascia media",
        massima: "Fascia massima",
    };

    const classification = $derived(result.classification);
    const thresholds = $derived(
        classification ? accord.thresholds[classification.sizeBand][classification.floorBand] : null,
    );

    const toggleParameter = (number: number, isChecked: boolean) => {
        const others = data.calculation.parameters.filter((value) => value !== number);
        data.calculation.parameters = isChecked ? [...others, number] : others;
    };
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Elementi oggettivi di classificazione</Card.Title>
        <Card.Description>
            Seleziona gli elementi presenti e usufruibili dal conduttore. Dal numero di elementi, dalla superficie
            calpestabile e dal piano dipende la fascia (minima, media, massima).
        </Card.Description>
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
                    <Field.Label for="no-indoor-bathroom">{accord.noIndoorBathroomLabel}</Field.Label>
                    <Field.Description>
                        In assenza di servizi igienici interni si applica sempre la fascia minima e il canone
                        massimo è il minimo aumentato del 5%.
                    </Field.Description>
                </Field.Content>
            </Field.Field>
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
        </Card.Footer>
    {/if}
</Card.Root>
