<script lang="ts">
    import { Clock, Mail, MapPin, Phone } from "@lucide/svelte";
    import * as Card from "#lib/components/ui/card/index.ts";
    import { CONTACTS } from "#lib/contacts.ts";
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>{CONTACTS.fullName}</Card.Title>
    </Card.Header>
    <Card.Content>
        <address class="flex flex-col gap-3 not-italic">
            <p class="flex items-center gap-2">
                <MapPin class="size-4 shrink-0 text-primary" />
                {CONTACTS.address.street} - {CONTACTS.address.zipCode}
                {CONTACTS.address.city}
            </p>
            <p class="flex items-center gap-2">
                <Phone class="size-4 shrink-0 text-primary" />
                <span>
                    Tel. e fax
                    <a href={CONTACTS.phone.href} class="font-medium hover:underline">
                        {CONTACTS.phone.label}
                    </a>
                </span>
            </p>
            <p class="flex items-center gap-2">
                <Mail class="size-4 shrink-0 text-primary" />
                <a href="mailto:{CONTACTS.email}" class="font-medium hover:underline">
                    {CONTACTS.email}
                </a>
            </p>
            <p class="flex items-start gap-2">
                <Clock class="mt-0.5 size-4 shrink-0 text-primary" />
                {CONTACTS.openingHours}
            </p>
        </address>
    </Card.Content>
</Card.Root>
