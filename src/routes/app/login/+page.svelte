<script lang="ts">
    import { enhance } from "$app/forms";
    import type { PageProps } from "./$types";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Input } from "#lib/components/ui/input/index.ts";
    import IconConfediliziaComo from "#lib/assets/icon-confedilizia-como.svelte";

    let { form }: PageProps = $props();

    let isSubmitting = $state(false);
</script>

<svelte:head>
    <title>Accedi all'area riservata - Confedilizia Como</title>
</svelte:head>

<div class="flex min-h-dvh flex-col items-center justify-center gap-6 bg-muted/40 p-6">
    <a href="/" class="flex items-center gap-3" aria-label="Torna al sito">
        <IconConfediliziaComo class="h-10 w-auto" />
        <span class="font-serif text-lg text-primary italic">Confedilizia Como</span>
    </a>

    <Card.Root class="w-full max-w-sm">
        <Card.Header>
            <Card.Title>Accedi all'area riservata</Card.Title>
            <Card.Description>
                Inserisci le credenziali che ti sono state fornite dall'associazione.
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <form
                method="POST"
                use:enhance={() => {
                    isSubmitting = true;
                    return async ({ update }) => {
                        await update({ reset: false });
                        isSubmitting = false;
                    };
                }}
            >
                <Field.Group>
                    <Field.Field data-invalid={form?.message ? true : undefined}>
                        <Field.Label for="email">Email</Field.Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            placeholder="nome@esempio.it"
                            value={form?.email ?? ""}
                            required
                        />
                    </Field.Field>
                    <Field.Field data-invalid={form?.message ? true : undefined}>
                        <Field.Label for="password">Password</Field.Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autocomplete="current-password"
                            required
                        />
                        {#if form?.message}
                            <Field.Error role="alert">{form.message}</Field.Error>
                        {/if}
                    </Field.Field>
                    <Field.Field>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Accesso in corso…" : "Accedi"}
                        </Button>
                    </Field.Field>
                </Field.Group>
            </form>
        </Card.Content>
    </Card.Root>

    <Button href="/" variant="link">Torna al sito</Button>
</div>
