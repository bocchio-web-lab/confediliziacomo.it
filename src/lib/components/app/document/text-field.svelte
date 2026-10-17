<script lang="ts">
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Input } from "#lib/components/ui/input/index.ts";

    interface Props {
        id: string;
        label: string;
        value: string;
        type?: "text" | "date";
        placeholder?: string;
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
    <Field.Label for={id}>{label}</Field.Label>
    <Input {id} {type} {placeholder} {required} {disabled} bind:value />
    {#if description}
        <Field.Description>{description}</Field.Description>
    {/if}
</Field.Field>
