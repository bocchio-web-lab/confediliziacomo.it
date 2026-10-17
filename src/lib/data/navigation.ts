export interface SubMenuEntry {
    label: string;
    href: string;
}

export interface MenuEntry {
    label: string;
    href: string;
    subMenuEntries: readonly SubMenuEntry[];
}

export const MENU_ENTRIES: readonly MenuEntry[] = [
    {
        label: "Presentazione",
        href: "/",
        subMenuEntries: [
            { label: "Storia e scopo", href: "/#storia" },
            { label: "Contatti e orari", href: "/#contatti" },
            { label: "Corsi di formazione", href: "/#formazione" },
        ],
    },
    {
        label: "Consiglio",
        href: "/consiglio",
        subMenuEntries: [
            { label: "Presidenza", href: "/consiglio#presidenza" },
            { label: "Consiglieri", href: "/consiglio#consiglieri" },
            { label: "Revisori dei conti", href: "/consiglio#revisori" },
        ],
    },
    {
        label: "Servizi",
        href: "/servizi",
        subMenuEntries: [
            { label: "Servizi gratuiti per i soci", href: "/servizi#servizi-soci" },
            {
                label: "Altri servizi con diritti di segreteria",
                href: "/servizi#servizi-a-pagamento",
            },
            { label: "Tariffe per i non soci", href: "/servizi#tariffe-non-soci" },
            { label: "Sala per piccole assemblee", href: "/servizi#sala-assemblee" },
            {
                label: "Servizi di professionisti esterni",
                href: "/servizi#servizi-esterni",
            },
            { label: "Quote associative", href: "/servizi#quote-associative" },
        ],
    },
    {
        label: "Normativa",
        href: "/normativa",
        subMenuEntries: [
            { label: "Scadenzario tributario", href: "/normativa#scadenzario" },
            { label: "Novità", href: "/normativa#novita" },
            { label: "Recupero dei seminterrati", href: "/normativa#seminterrati" },
            { label: "I nostri pareri", href: "/normativa#pareri" },
            { label: "Riforma del condominio", href: "/normativa#riforma-condominio" },
            { label: "Cedolare secca", href: "/normativa#cedolare-secca" },
            {
                label: "Accordi territoriali e contratti agevolati",
                href: "/normativa#accordi-territoriali",
            },
            { label: "Circolari ai soci", href: "/normativa#circolari" },
            { label: "Interessi legali", href: "/normativa#interessi-legali" },
            { label: "Imposta di registro", href: "/normativa#imposta-registro" },
            {
                label: "Promemoria contratti di locazione",
                href: "/normativa#promemoria-contratti",
            },
        ],
    },
    {
        label: "Consulenti",
        href: "/consulenti",
        subMenuEntries: [
            { label: "Assistenza legale", href: "/consulenti#assistenza-legale" },
            { label: "Consulenza urbanistica", href: "/consulenti#consulenza-urbanistica" },
            { label: "Assistenza notarile", href: "/consulenti#assistenza-notarile" },
            { label: "Assistenza tecnica", href: "/consulenti#assistenza-tecnica" },
            { label: "Assistenza fiscale", href: "/consulenti#assistenza-fiscale" },
            { label: "Consulenza lavoro", href: "/consulenti#consulenza-lavoro" },
            { label: "Problemi condominiali", href: "/consulenti#problemi-condominiali" },
            {
                label: "Assistenza assicurativa",
                href: "/consulenti#assistenza-assicurativa",
            },
            { label: "Consulenza antincendio", href: "/consulenti#consulenza-antincendio" },
        ],
    },
    {
        label: "Registro amministratori",
        href: "/registro-amministratori",
        subMenuEntries: [
            { label: "Elenco degli iscritti", href: "/registro-amministratori#elenco" },
            {
                label: "Registro nazionale e regolamenti",
                href: "/registro-amministratori#regolamenti",
            },
            { label: "Rendiconto tipo", href: "/registro-amministratori#rendiconto-tipo" },
        ],
    },
];
