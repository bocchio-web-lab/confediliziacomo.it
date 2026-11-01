<script lang="ts">
    import * as Card from "#lib/components/ui/card/index.ts";
    import { helpState } from "./help.svelte.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { NET_SURFACE_ID } from "#lib/accords/calculate.ts";
    import type { AccordDefinition, CalculationResult } from "#lib/accords/types.ts";
    import type { DocumentData } from "#lib/documents/types.ts";
    import { formatNumber, formatPercent } from "#lib/format.ts";
    import NumberField from "./number-field.svelte";

    interface Props {
        accord: AccordDefinition;
        data: DocumentData;
        result: CalculationResult;
    }

    let { accord, data = $bindable(), result }: Props = $props();
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Calcolo della superficie</Card.Title>
        {#if helpState.showAll}
            <Card.Description>
                Superficie convenzionale ai sensi dell'accordo: ogni area conta in percentuale.
            </Card.Description>
        {/if}
    </Card.Header>
    <Card.Content>
        <Field.Group>
            <NumberField
                id="surface-net"
                label="Superficie calpestabile appartamento"
                unit="mq"
                bind:value={data.calculation.surfaces[NET_SURFACE_ID]}
                description="Al 100%. Determina anche le soglie di classificazione (fino a 60 mq, da 60 a 100 mq, oltre 100 mq)."
            />
            {#if result.surface && result.surface.smallUnitBonusPercent > 0}
                <p class="rounded-md bg-muted px-3 py-2 text-sm">
                    Maggiorazione per superficie inferiore o uguale a 60 mq:
                    <strong>{formatPercent(result.surface.smallUnitBonusPercent)}</strong>
                    = {formatNumber(result.surface.smallUnitBonusArea)} mq (con un massimo di 62 mq).
                </p>
            {/if}
            <div class="grid gap-4 sm:grid-cols-2">
                {#each accord.surfaceItems as item (item.id)}
                    <NumberField
                        id="surface-{item.id}"
                        label={item.label}
                        unit="mq"
                        bind:value={data.calculation.surfaces[item.id]}
                        description="Conta al {formatNumber(item.coefficient * 100, 0)}%."
                    />
                {/each}
            </div>
        </Field.Group>
    </Card.Content>
    <Card.Footer class="justify-between border-t text-sm">
        <span class="text-muted-foreground">Totale superficie convenzionale</span>
        <span class="text-lg font-semibold">{formatNumber(result.surface?.total ?? 0)} mq</span>
    </Card.Footer>
</Card.Root>
