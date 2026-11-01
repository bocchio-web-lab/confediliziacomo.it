<script lang="ts">
    import { enhance } from "$app/forms";
    import type { PageProps } from "./$types";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Card from "#lib/components/ui/card/index.ts";
    import * as Field from "#lib/components/ui/field/index.ts";
    import { Input } from "#lib/components/ui/input/index.ts";
    import { PASSWORD_HINT } from "#lib/auth-rules.ts";

    let { form }: PageProps = $props();

    let isSubmitting = $state(false);

    const errors = $derived<Record<string, string | undefined>>(form?.errors ?? {});
</script>

<svelte:head>
    <title>Registrati - Confedilizia Como</title>
</svelte:head>

<Card.Root>
    <Card.Header>
        <Card.Title>Crea un account</Card.Title>
        <Card.Description>
            Per registrarti serve il codice di registrazione che ti ha dato l'associazione.
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
                <Field.Field data-invalid={errors.name ? true : undefined}>
                    <Field.Label for="name">Nome e cognome</Field.Label>
                    <Input id="name" name="name" autocomplete="name" value={form?.values?.name ?? ""} required />
                    {#if errors.name}<Field.Error role="alert">{errors.name}</Field.Error>{/if}
                </Field.Field>
                <Field.Field data-invalid={errors.email ? true : undefined}>
                    <Field.Label for="email">Email</Field.Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autocomplete="email"
                        value={form?.values?.email ?? ""}
                        required
                    />
                    {#if errors.email}<Field.Error role="alert">{errors.email}</Field.Error>{/if}
                </Field.Field>
                <Field.Field data-invalid={errors.password ? true : undefined}>
                    <Field.Label for="password">Password</Field.Label>
                    <Input id="password" name="password" type="password" autocomplete="new-password" required />
                    <Field.Description>{PASSWORD_HINT}</Field.Description>
                    {#if errors.password}<Field.Error role="alert">{errors.password}</Field.Error>{/if}
                </Field.Field>
                <Field.Field data-invalid={errors.passwordConfirmation ? true : undefined}>
                    <Field.Label for="passwordConfirmation">Ripeti la password</Field.Label>
                    <Input
                        id="passwordConfirmation"
                        name="passwordConfirmation"
                        type="password"
                        autocomplete="new-password"
                        required
                    />
                    {#if errors.passwordConfirmation}
                        <Field.Error role="alert">{errors.passwordConfirmation}</Field.Error>
                    {/if}
                </Field.Field>
                <Field.Field data-invalid={errors.code ? true : undefined}>
                    <Field.Label for="code">Codice di registrazione</Field.Label>
                    <Input id="code" name="code" autocomplete="off" required />
                    {#if errors.code}<Field.Error role="alert">{errors.code}</Field.Error>{/if}
                </Field.Field>
                <Field.Field>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Registrazione in corso…" : "Registrati"}
                    </Button>
                    <Field.Description class="text-center">
                        Hai già un account? <a href="/login" class="underline underline-offset-4">Accedi</a>
                    </Field.Description>
                </Field.Field>
            </Field.Group>
        </form>
    </Card.Content>
</Card.Root>
