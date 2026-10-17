<script lang="ts">
    import { Check } from "@lucide/svelte";

    interface Props {
        items: readonly string[];
    }

    let { items }: Props = $props();
</script>

<ul class="flex flex-col gap-3">
    {#each items as item}
        <li class="flex items-start gap-2">
            <Check class="mt-0.5 size-4 shrink-0 text-primary" />
            {item}
        </li>
    {/each}
</ul>
