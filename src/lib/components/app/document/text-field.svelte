<script lang="ts">
    import { X } from "@lucide/svelte";
    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Input } from "#lib/components/ui/input/index.ts";
    import LabelWithHelp from "./label-with-help.svelte";

    interface Props {
        id: string;
        label: string;
        value: string;
        type?: "text" | "date";
        placeholder?: string;
        /** Explanation of the field, see LabelWithHelp. */
        description?: string;
        required?: boolean;
        disabled?: boolean;
    }

    let {
        id,
        label,
        value = $bindable(""),
        type = "text",
        placeholder,
        description,
        required = false,
        disabled = false,
    }: Props = $props();
</script>

<Field.Field>
    <LabelWithHelp for={id} help={description}>{label}</LabelWithHelp>
    <div class="flex gap-2">
        <Input {id} {type} {placeholder} {required} {disabled} bind:value class="flex-1" />
        <!-- On a phone the date picker has no way to empty the field: an optional date can be cleared with a button. -->
        {#if type === "date" && !required && !disabled && value}
            <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Cancella la data"
                title="Cancella la data"
                onclick={() => (value = "")}
            >
                <X />
            </Button>
        {/if}
    </div>
</Field.Field>
