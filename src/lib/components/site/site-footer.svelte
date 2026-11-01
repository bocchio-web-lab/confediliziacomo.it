<script lang="ts">
    import { Clock, Mail, MapPin, Phone } from "@lucide/svelte";

    import { Button } from "#lib/components/ui/button/index.ts";
    import * as Separator from "#lib/components/ui/separator/index.ts";
    import LogoConfediliziaComo from "#lib/assets/logo-confedilizia-como.svelte";
    import { CONTACTS } from "#lib/contacts.ts";
    import { MENU_ENTRIES } from "#lib/data/navigation.ts";
</script>

<footer class="border-t-4 border-primary bg-muted print:hidden">
    <div class="container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div class="space-y-4">
            <a href="/" aria-label="Confedilizia Como, pagina iniziale">
                <LogoConfediliziaComo class="h-10 w-auto" />
            </a>
            <p class="font-serif text-lg">{CONTACTS.fullName}</p>
            <p class="font-serif text-primary italic">{CONTACTS.slogan}</p>
        </div>

        <div class="space-y-4">
            <h2 class="font-semibold">Contatti</h2>
            <address class="flex flex-col gap-3 text-sm not-italic">
                <p class="flex items-start gap-2">
                    <MapPin class="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                        {CONTACTS.address.street}<br />
                        {CONTACTS.address.zipCode}
                        {CONTACTS.address.city}
                    </span>
                </p>
                <p class="flex items-center gap-2">
                    <Phone class="size-4 shrink-0 text-primary" />
                    <a href={CONTACTS.phone.href} class="hover:underline">{CONTACTS.phone.label}</a>
                </p>
                <p class="flex items-center gap-2">
                    <Mail class="size-4 shrink-0 text-primary" />
                    <a href="mailto:{CONTACTS.email}" class="hover:underline">{CONTACTS.email}</a>
                </p>
            </address>
        </div>

        <div class="space-y-4">
            <h2 class="font-semibold">Orari</h2>
            <p class="flex items-start gap-2 text-sm">
                <Clock class="mt-0.5 size-4 shrink-0 text-primary" />
                {CONTACTS.openingHours}
            </p>
            <Button href={CONTACTS.facebookUrl} target="_blank" rel="noopener" variant="outline" size="sm">
                Seguici su Facebook
            </Button>
        </div>

        <nav class="space-y-4" aria-label="Piè di pagina">
            <h2 class="font-semibold">Il sito</h2>
            <ul class="flex flex-col gap-2 text-sm">
                {#each MENU_ENTRIES as entry}
                    <li>
                        <a href={entry.href} class="hover:underline">{entry.label}</a>
                    </li>
                {/each}
            </ul>
        </nav>
    </div>

    <Separator.Root />

    <div class="container flex flex-col gap-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p class="text-muted-foreground">
            © {new Date().getFullYear()} {CONTACTS.fullName}
        </p>
        <div class="flex flex-wrap items-center gap-4">
            <a
                href={CONTACTS.nationalWebsiteUrl}
                target="_blank"
                rel="noopener"
                class="text-muted-foreground hover:underline"
            >
                Confedilizia nazionale
            </a>
            <Button href="/login" variant="outline" size="sm">Area riservata</Button>
        </div>
    </div>
</footer>
