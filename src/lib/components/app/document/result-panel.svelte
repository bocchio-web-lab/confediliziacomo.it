<script lang="ts">
    import { CircleCheck, CircleX, Info, TriangleAlert } from "@lucide/svelte";

    import { Badge } from "#lib/components/ui/badge/index.ts";
    import * as Alert from "#lib/components/ui/alert/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import { Separator } from "#lib/components/ui/separator/index.ts";
    import type { AccordDefinition, CalculationResult, Fascia } from "#lib/accords/types.ts";
    import { checkConformity } from "#lib/documents/conformity.ts";
    import type { DocumentDetails, DocumentKind } from "#lib/documents/types.ts";
    import { formatDate, formatMoney, formatNumber, formatPercent } from "#lib/format.ts";

    interface Props {
        kind: DocumentKind;
        accord: AccordDefinition;
        result: CalculationResult;
        details: DocumentDetails;
        /** Result stored when the document was last saved, if any. */
        savedResult?: CalculationResult | null;
    }

    let { kind, accord, result, details, savedResult = null }: Props = $props();

    const FASCIA_LABELS: Record<Fascia, string> = {
        minima: "Minima",
        media: "Media",
        massima: "Massima",
    };

    const conformity = $derived(checkConformity(result, details));
    const monthly = $derived(result.partialLease?.monthly ?? result.monthly);
    const annual = $derived(result.partialLease?.annual ?? result.annual);

    const differsFromSaved = $derived(
        savedResult?.monthly && result.monthly
            ? Math.abs(savedResult.monthly.min - result.monthly.min) > 0.005 ||
                  Math.abs(savedResult.monthly.max - result.monthly.max) > 0.005
            : false,
    );
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Risultato</Card.Title>
        <Card.Description>
            {accord.territoryLabel}: accordo {accord.referenceText}.
        </Card.Description>
    </Card.Header>
    <Card.Content class="gap-4">
        {#if result.issues.length > 0}
            <Alert.Root>
                <Info />
                <Alert.Title>Completa i dati</Alert.Title>
                <Alert.Description>
                    <ul class="list-disc pl-4">
                        {#each result.issues as issue}
                            <li>{issue}</li>
                        {/each}
                    </ul>
                </Alert.Description>
            </Alert.Root>
        {/if}

        {#each result.warnings as warning}
            <Alert.Root variant="destructive">
                <TriangleAlert />
                <Alert.Description>{warning}</Alert.Description>
            </Alert.Root>
        {/each}

        {#if differsFromSaved && savedResult?.monthly && result.monthly}
            <Alert.Root>
                <Info />
                <Alert.Title>Calcolo aggiornato</Alert.Title>
                <Alert.Description>
                    Con gli indici ISTAT attuali il canone mensile minimo passa da
                    {formatMoney(savedResult.monthly.min)} a {formatMoney(result.monthly.min)}. Salva per aggiornare il
                    documento.
                </Alert.Description>
            </Alert.Root>
        {/if}

        {#if result.classification}
            <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Fascia di appartenenza</span>
                <Badge>{FASCIA_LABELS[result.classification.fascia]}</Badge>
            </div>
        {/if}
        {#if result.surface}
            <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Superficie convenzionale</span>
                <span class="font-medium">{formatNumber(result.surface.total)} mq</span>
            </div>
        {/if}

        {#if result.ratePerSquareMeter && monthly && annual}
            <Separator />
            <dl class="space-y-3">
                <div>
                    <dt class="text-sm text-muted-foreground">Canone al mq (mensile)</dt>
                    <dd class="font-medium">
                        {formatMoney(result.ratePerSquareMeter.min)} - {formatMoney(result.ratePerSquareMeter.max)}
                    </dd>
                </div>
                <div>
                    <dt class="text-sm text-muted-foreground">
                        Canone mensile {result.partialLease ? "(porzione)" : ""}
                    </dt>
                    <dd class="text-lg font-semibold">{formatMoney(monthly.min)} - {formatMoney(monthly.max)}</dd>
                </div>
                <div>
                    <dt class="text-sm text-muted-foreground">
                        Canone annuo {result.partialLease ? "(porzione)" : ""}
                    </dt>
                    <dd class="font-medium">{formatMoney(annual.min)} - {formatMoney(annual.max)}</dd>
                </div>
            </dl>

            <Separator />
            <div class="space-y-1 text-sm text-muted-foreground">
                {#if result.rateSource && result.baseRate}
                    <p>
                        {result.rateSource}: base {formatMoney(result.baseRate.min)} - {formatMoney(result.baseRate.max)}
                        al mq.
                    </p>
                {/if}
                {#each result.surcharges as surcharge}
                    <p>{surcharge.label}: {formatPercent(surcharge.percent)}</p>
                {/each}
                {#if result.istat}
                    <p>
                        Coefficiente ISTAT: {formatNumber(result.istat.coefficient, 3)} (in vigore dal
                        {formatDate(result.istat.validFrom)}).
                    </p>
                {/if}
                <p>{accord.ratesNote}</p>
            </div>
        {/if}

        {#if kind === "attestation" && result.monthly}
            <Separator />
            {#if conformity.status === "not-provided"}
                <p class="text-sm text-muted-foreground">
                    Inserisci il canone annuo convenuto per verificarne la conformità.
                </p>
            {:else if conformity.status === "conforming"}
                <Alert.Root>
                    <CircleCheck />
                    <Alert.Title>Canone conforme</Alert.Title>
                    <Alert.Description>
                        {formatMoney(conformity.annualRent)} all'anno rientra tra {formatMoney(conformity.min)} e
                        {formatMoney(conformity.max)}.
                    </Alert.Description>
                </Alert.Root>
            {:else}
                <Alert.Root variant="destructive">
                    <CircleX />
                    <Alert.Title>Canone non conforme</Alert.Title>
                    <Alert.Description>
                        {formatMoney(conformity.annualRent)} all'anno è
                        {conformity.status === "below-minimum" ? "inferiore al minimo" : "superiore al massimo"} previsto
                        ({formatMoney(conformity.min)} - {formatMoney(conformity.max)}).
                    </Alert.Description>
                </Alert.Root>
            {/if}
        {/if}
    </Card.Content>
</Card.Root>
