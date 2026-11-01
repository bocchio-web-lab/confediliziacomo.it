<script lang="ts">
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
    <Input {id} {type} {placeholder} {required} {disabled} bind:value />
</Field.Field>
