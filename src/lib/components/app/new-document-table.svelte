<script lang="ts">
    import { Plus } from "@lucide/svelte";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Table from "#lib/components/ui/table/index.ts";
    import { slugOfTerritory } from "#lib/accords/registry.ts";
    import type { Territory } from "#lib/accords/types.ts";
    import { KIND_LABELS, type DocumentKind } from "#lib/documents/types.ts";
    import { SEQUENCE_LABELS } from "#lib/documents/numbering.ts";

    // First the territory, then the kind of document.
    const TERRITORIES: Territory[] = ["city", "province"];
    const KINDS: DocumentKind[] = ["prospectus", "attestation"];
</script>

<Card.Root class="py-0">
    <Card.Header class="pt-4">
        <Card.Title>Nuovo documento</Card.Title>
    </Card.Header>
    <Table.Root>
        <Table.Body>
            {#each TERRITORIES as territory (territory)}
                <Table.Row class="bg-muted/50 hover:bg-muted/50">
                    <Table.Cell colspan={2} class="pl-6 font-semibold">{SEQUENCE_LABELS[territory]}</Table.Cell>
                </Table.Row>
                {#each KINDS as kind (kind)}
                    <Table.Row>
                        <Table.Cell class="pl-10">{KIND_LABELS[kind].singular}</Table.Cell>
                        <Table.Cell class="pr-6 text-right">
                            <Button
                                href="/{KIND_LABELS[kind].slug}/nuovo/{slugOfTerritory(territory)}"
                                size="sm"
                                variant={kind === "prospectus" ? "default" : "outline"}
                            >
                                <Plus />
                                Crea
                            </Button>
                        </Table.Cell>
                    </Table.Row>
                {/each}
            {/each}
        </Table.Body>
    </Table.Root>
</Card.Root>
