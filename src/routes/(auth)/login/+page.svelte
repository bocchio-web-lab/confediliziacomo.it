<script lang="ts">
    import { enhance } from "$app/forms";
    import type { PageProps } from "./$types";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Input } from "#lib/components/ui/input/index.ts";

    let { data, form }: PageProps = $props();

    let isSubmitting = $state(false);
</script>

<svelte:head>
    <title>Accedi - Confedilizia Como</title>
</svelte:head>

<Card.Root>
    <Card.Header>
        <Card.Title>Accedi</Card.Title>
        <Card.Description>Inserisci le credenziali per entrare nell'area riservata.</Card.Description>
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
                    <div class="flex items-center">
                        <Field.Label for="password">Password</Field.Label>
                        <a href="/forgot-password" class="ml-auto text-sm underline-offset-4 hover:underline">
                            Password dimenticata?
                        </a>
                    </div>
                    <Input id="password" name="password" type="password" autocomplete="current-password" required />
                    {#if form?.message}
                        <Field.Error role="alert">{form.message}</Field.Error>
                    {/if}
                </Field.Field>
                <Field.Field>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Accesso in corso…" : "Accedi"}
                    </Button>
                    {#if data.isRegistrationOpen}
                        <Field.Description class="text-center">
                            Non hai un account? <a href="/register" class="underline underline-offset-4">Registrati</a>
                        </Field.Description>
                    {/if}
                </Field.Field>
            </Field.Group>
        </form>
    </Card.Content>
</Card.Root>
