<script lang="ts">
    import type { Party } from "#lib/documents/types.ts";
    import TextField from "./text-field.svelte";

    interface Props {
        /** Prefix of the ids of the fields: they must be different for each person. */
        id: string;
        party: Party;
        /** The attestation of the Provincia also prints where and when the person was born. */
        withBirth: boolean;
    }

    let { id, party = $bindable(), withBirth }: Props = $props();
</script>

<div class="grid gap-4 sm:grid-cols-3">
    <TextField id="{id}-name" label="Nome e cognome" bind:value={party.name} />
    {#if withBirth}
        <TextField id="{id}-birth-place" label="Nato a" bind:value={party.birthPlace} />
        <TextField id="{id}-birth-date" type="date" label="Nato il" bind:value={party.birthDate} />
    {/if}
    <TextField id="{id}-tax-code" label="Codice fiscale" bind:value={party.taxCode} />
    <TextField
        id="{id}-residence"
        label="Residenza"
        placeholder={withBirth ? "Comune, CAP, via e numero" : undefined}
        bind:value={party.residence}
    />
</div>
