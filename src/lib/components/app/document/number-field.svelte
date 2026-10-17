<script lang="ts">
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Input } from "#lib/components/ui/input/index.ts";

    interface Props {
        id: string;
        label: string;
        value: number;
        description?: string;
        unit?: string;
        max?: number;
        /** Show an empty box instead of 0, so the user does not have to delete it. */
        blankZero?: boolean;
        disabled?: boolean;
    }

    let {
        id,
        label,
        value = $bindable(0),
        description,
        unit,
        max,
        blankZero = true,
        disabled = false,
    }: Props = $props();
</script>

<Field.Field>
    <Field.Label for={id}>{label}</Field.Label>
    <div class="relative">
        <Input
            {id}
            type="number"
            inputmode="decimal"
            min="0"
            {max}
            step="any"
            {disabled}
            value={blankZero && value === 0 ? "" : value}
            oninput={(event) => (value = event.currentTarget.valueAsNumber || 0)}
            class={unit ? "pr-12" : ""}
        />
        {#if unit}
            <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                {unit}
            </span>
        {/if}
    </div>
    {#if description}
        <Field.Description>{description}</Field.Description>
    {/if}
</Field.Field>
