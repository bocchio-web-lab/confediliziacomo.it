<script lang="ts">
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Table from "#lib/components/ui/table/index.ts";
    import type { PricedItem } from "#lib/data/types.ts";

    interface Props {
        items: readonly PricedItem[];
    }

    let { items }: Props = $props();
</script>

<Card.Root class="py-0">
    <Table.Root>
        <Table.Header>
            <Table.Row>
                <Table.Head>Servizio</Table.Head>
                <Table.Head class="text-right">Importo</Table.Head>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#each items as item}
                <Table.Row>
                    <Table.Cell class="whitespace-normal">{item.label}</Table.Cell>
                    <Table.Cell class="text-right font-medium">{item.price}</Table.Cell>
                </Table.Row>
            {/each}
        </Table.Body>
    </Table.Root>
</Card.Root>
