<script lang="ts">
    import type { Snippet } from "svelte";
    import { GraduationCap } from "@lucide/svelte";
    import * as Card from "#lib/components/ui/card/index.ts";

    interface Props {
        children?: Snippet;
    }

    let { children }: Props = $props();
</script>

<Card.Root>
    <Card.Header>
        <Card.Title class="flex items-center gap-2">
            <GraduationCap class="size-5 text-primary" />
            Ogni anno Confedilizia Como organizza
        </Card.Title>
        <Card.Description>
            Corsi di formazione periodica e formazione iniziale per amministratori di condominio.
        </Card.Description>
    </Card.Header>
    {#if children}
        <Card.Content>
            {@render children()}
        </Card.Content>
    {/if}
</Card.Root>
