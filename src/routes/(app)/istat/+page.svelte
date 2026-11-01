<script lang="ts">
    import { enhance } from "$app/forms";
    import { Pencil, Trash2 } from "@lucide/svelte";
    import { toast } from "svelte-sonner";
    import type { PageProps } from "./$types";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as AlertDialog from "#lib/components/ui/alert-dialog/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Input } from "#lib/components/ui/input/index.ts";
    import * as Table from "#lib/components/ui/table/index.ts";
    import { formatDate, formatDateTime, formatNumber, todayIso } from "#lib/format.ts";

    let { data, form }: PageProps = $props();

    let validFrom = $state(todayIso().slice(0, 8) + "01");
    let coefficient = $state("");

    const edit = (row: { validFrom: string; coefficient: number }) => {
        validFrom = row.validFrom;
        coefficient = String(row.coefficient);
    };
</script>

<svelte:head>
    <title>Indici ISTAT - Area riservata Confedilizia Como</title>
</svelte:head>

<div class="space-y-1">
    <h1 class="text-2xl font-semibold tracking-tight">Indici ISTAT</h1>
    <p class="max-w-3xl text-muted-foreground">
        Coefficienti di rivalutazione dei canoni dell'accordo per il Comune di Como. Ogni coefficiente
        vale per i contratti stipulati dalla data indicata fino alla data della riga successiva. Prospetti
        e attestazioni si ricalcolano di conseguenza quando vengono riaperti.
    </p>
</div>

<div class="grid items-start gap-6 lg:grid-cols-3">
    <Card.Root>
        <Card.Header>
            <Card.Title>Inserisci o modifica un indice</Card.Title>
            <Card.Description>
                Se esiste già una riga con la stessa data, il coefficiente viene sostituito.
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <form
                method="POST"
                action="?/save"
                use:enhance={() =>
                    async ({ result, update }) => {
                        await update({ reset: false });
                        if (result.type === "success") toast.success("Indice ISTAT salvato.");
                    }}
            >
                <Field.Group>
                    <Field.Field>
                        <Field.Label for="validFrom">In vigore dal</Field.Label>
                        <Input id="validFrom" name="validFrom" type="date" bind:value={validFrom} required />
                        <Field.Description>Di solito il primo giorno del mese.</Field.Description>
                    </Field.Field>
                    <Field.Field data-invalid={form && "message" in form && form.message ? true : undefined}>
                        <Field.Label for="coefficient">Coefficiente</Field.Label>
                        <Input
                            id="coefficient"
                            name="coefficient"
                            inputmode="decimal"
                            placeholder="1,234"
                            bind:value={coefficient}
                            required
                        />
                        <Field.Description>
                            Rapporto rispetto alla base dell'accordo (novembre 2020 = 1,000).
                        </Field.Description>
                        {#if form && "message" in form && form.message}
                            <Field.Error role="alert">{form.message}</Field.Error>
                        {/if}
                    </Field.Field>
                    <Button type="submit">Salva indice</Button>
                </Field.Group>
            </form>
        </Card.Content>
    </Card.Root>

    <Card.Root class="py-0 lg:col-span-2">
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>In vigore dal</Table.Head>
                    <Table.Head class="text-right">Coefficiente</Table.Head>
                    <Table.Head>Ultima modifica</Table.Head>
                    <Table.Head class="w-24"><span class="sr-only">Azioni</span></Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each data.indices as row (row.validFrom)}
                    <Table.Row>
                        <Table.Cell class="font-medium">{formatDate(row.validFrom)}</Table.Cell>
                        <Table.Cell class="text-right">{formatNumber(row.coefficient, 3)}</Table.Cell>
                        <Table.Cell class="whitespace-normal text-muted-foreground">
                            {formatDateTime(row.updatedAt)}{row.updatedByName ? `, ${row.updatedByName}` : " (importato da Excel)"}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                            <Button variant="ghost" size="icon-sm" onclick={() => edit(row)}>
                                <Pencil />
                                <span class="sr-only">Modifica</span>
                            </Button>
                            <AlertDialog.Root>
                                <AlertDialog.Trigger>
                                    {#snippet child({ props })}
                                        <Button {...props} variant="ghost" size="icon-sm">
                                            <Trash2 />
                                            <span class="sr-only">Elimina</span>
                                        </Button>
                                    {/snippet}
                                </AlertDialog.Trigger>
                                <AlertDialog.Content>
                                    <AlertDialog.Header>
                                        <AlertDialog.Title>Eliminare l'indice?</AlertDialog.Title>
                                        <AlertDialog.Description>
                                            Verrà eliminato l'indice in vigore dal {formatDate(row.validFrom)}. I
                                            contratti di quel periodo useranno l'indice precedente.
                                        </AlertDialog.Description>
                                    </AlertDialog.Header>
                                    <AlertDialog.Footer>
                                        <AlertDialog.Cancel>Annulla</AlertDialog.Cancel>
                                        <form
                                            method="POST"
                                            action="?/delete"
                                            use:enhance={() =>
                                                async ({ result, update }) => {
                                                    await update();
                                                    if (result.type === "success") toast.success("Indice eliminato.");
                                                }}
                                        >
                                            <input type="hidden" name="validFrom" value={row.validFrom} />
                                            <AlertDialog.Action type="submit">Elimina</AlertDialog.Action>
                                        </form>
                                    </AlertDialog.Footer>
                                </AlertDialog.Content>
                            </AlertDialog.Root>
                        </Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    </Card.Root>
</div>
