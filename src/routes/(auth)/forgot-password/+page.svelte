<script lang="ts">
    import { enhance } from "$app/forms";
    import type { PageProps } from "./$types";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Input } from "#lib/components/ui/input/index.ts";

    let { form }: PageProps = $props();

    let isSubmitting = $state(false);
</script>

<svelte:head>
    <title>Password dimenticata - Confedilizia Como</title>
</svelte:head>

<Card.Root>
    <Card.Header>
        <Card.Title>Password dimenticata</Card.Title>
        <Card.Description>Ti mandiamo un link per scegliere una nuova password.</Card.Description>
    </Card.Header>
    <Card.Content>
        {#if form && "sent" in form}
            <p role="status" class="text-sm">
                Se esiste un account con l'indirizzo <strong>{form.email}</strong>, abbiamo inviato un'email con il
                link per reimpostare la password. Il link vale un'ora.
            </p>
        {:else}
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
                    <Field.Field data-invalid={form && "message" in form ? true : undefined}>
                        <Field.Label for="email">Email</Field.Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            value={form && "email" in form ? form.email : ""}
                            required
                        />
                        {#if form && "message" in form && form.message}
                            <Field.Error role="alert">{form.message}</Field.Error>
                        {/if}
                    </Field.Field>
                    <Field.Field>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Invio in corso…" : "Invia il link"}
                        </Button>
                    </Field.Field>
                </Field.Group>
            </form>
        {/if}
    </Card.Content>
    <Card.Footer class="justify-center">
        <a href="/login" class="text-sm underline-offset-4 hover:underline">Torna al login</a>
    </Card.Footer>
</Card.Root>
