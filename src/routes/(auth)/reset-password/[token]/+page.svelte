<script lang="ts">
    import { enhance } from "$app/forms";
    import type { PageProps } from "./$types";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Input } from "#lib/components/ui/input/index.ts";
    import { PASSWORD_HINT } from "#lib/auth-rules.ts";

    let { data, form }: PageProps = $props();

    let isSubmitting = $state(false);

    const isUsable = $derived(data.isTokenValid && !(form && "isExpired" in form));
</script>

<svelte:head>
    <title>Nuova password - Confedilizia Como</title>
</svelte:head>

<Card.Root>
    <Card.Header>
        <Card.Title>Scegli una nuova password</Card.Title>
    </Card.Header>
    <Card.Content>
        {#if !isUsable}
            <p role="alert" class="text-sm">
                Il link non è valido o è scaduto.
                <a href="/forgot-password" class="underline underline-offset-4">Richiedine uno nuovo</a>.
            </p>
        {:else}
            <form
                method="POST"
                use:enhance={() => {
                    isSubmitting = true;
                    return async ({ update }) => {
                        await update({ reset: true });
                        isSubmitting = false;
                    };
                }}
            >
                <Field.Group>
                    <Field.Field data-invalid={form?.message ? true : undefined}>
                        <Field.Label for="password">Nuova password</Field.Label>
                        <Input id="password" name="password" type="password" autocomplete="new-password" required />
                        <Field.Description>{PASSWORD_HINT}</Field.Description>
                    </Field.Field>
                    <Field.Field data-invalid={form?.message ? true : undefined}>
                        <Field.Label for="passwordConfirmation">Ripeti la password</Field.Label>
                        <Input
                            id="passwordConfirmation"
                            name="passwordConfirmation"
                            type="password"
                            autocomplete="new-password"
                            required
                        />
                        {#if form?.message}<Field.Error role="alert">{form.message}</Field.Error>{/if}
                    </Field.Field>
                    <Field.Field>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Salvataggio…" : "Salva la password"}
                        </Button>
                    </Field.Field>
                </Field.Group>
            </form>
        {/if}
    </Card.Content>
</Card.Root>
