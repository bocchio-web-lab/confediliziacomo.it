<script lang="ts">
    import * as Card from "#lib/components/ui/card/index.ts";
    import { helpState } from "./help.svelte.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Switch } from "#lib/components/ui/switch/index.ts";
    import type { CalculationResult } from "#lib/accords/types.ts";
    import type { DocumentData, DocumentKind } from "#lib/documents/types.ts";
    import { formatNumber } from "#lib/format.ts";
    import NumberField from "./number-field.svelte";

    interface Props {
        kind: DocumentKind;
        data: DocumentData;
        result: CalculationResult;
    }

    let { kind, data = $bindable(), result }: Props = $props();

    const isPartial = $derived(data.calculation.partialLease !== null);

    const setPartial = (isEnabled: boolean) => {
        data.calculation.partialLease = isEnabled ? { tenantSurface: 0, otherTenantsSurface: 0 } : null;
    };
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Locazione parziale</Card.Title>
        {#if helpState.showAll}
            <Card.Description>
                È consentita la locazione di porzioni d'immobile: il canone dell'intero appartamento è frazionato in
                proporzione alla superficie di ciascuna porzione, considerando anche le parti e i servizi condivisi.
            </Card.Description>
        {/if}
    </Card.Header>
    <Card.Content>
        <Field.Group>
            <Field.Field orientation="horizontal">
                <Switch id="partial-lease" checked={isPartial} onCheckedChange={setPartial} />
                <Field.Label for="partial-lease">Il contratto riguarda una porzione dell'immobile</Field.Label>
            </Field.Field>

            {#if data.calculation.partialLease}
                <div class="grid gap-4 sm:grid-cols-2">
                    <NumberField
                        id="partial-tenant"
                        label="Superficie in uso esclusivo al conduttore"
                        unit="mq"
                        bind:value={data.calculation.partialLease.tenantSurface}
                    />
                    <NumberField
                        id="partial-others"
                        label="Superficie in uso esclusivo ad altri conduttori"
                        unit="mq"
                        bind:value={data.calculation.partialLease.otherTenantsSurface}
                    />
                </div>
                {#if result.partialLease}
                    <p class="rounded-md bg-muted px-3 py-2 text-sm">
                        Superficie in uso condiviso tra tutti i conduttori:
                        <strong>{formatNumber(result.partialLease.sharedSurface)} mq</strong>. Il conduttore usufruisce
                        del <strong>{formatNumber(result.partialLease.share * 100)}%</strong> della superficie.
                    </p>
                {/if}
                {#if kind === "attestation"}
                    <NumberField
                        id="partial-agreed-rent"
                        label="Canone annuo convenuto per la porzione"
                        unit="€"
                        bind:value={data.details.partialAgreedAnnualRent}
                    />
                {/if}
            {/if}
        </Field.Group>
    </Card.Content>
</Card.Root>
