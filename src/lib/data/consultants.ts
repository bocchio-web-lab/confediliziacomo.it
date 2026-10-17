export interface ConsultantArea {
    id: string;
    title: string;
    members: readonly string[];
}

export const CONSULTANT_AREAS: readonly ConsultantArea[] = [
    {
        id: "assistenza-legale",
        title: "Assistenza legale",
        members: [
            "Avv. Isabella Bertola",
            "Avv. Claudio Bocchietti",
            "Avv. Simona Cantoni",
            "Avv. Elena Casartelli",
            "Avv. Sabrina Del Sordo",
            "Avv. Federico Dotti",
            "Avv. Mara Fumagalli",
            "Avv. Alessio Galvagno",
            "Avv. Licia Luraschi",
            "Avv. Laura Pellegrino",
            "Avv. Serena Pensa",
            "Avv. Fabiana Ronzoni",
            "Avv. Angelo Sollazzo",
            "Avv. Elena Vimercati",
        ],
    },
    {
        id: "consulenza-urbanistica",
        title: "Consulenza urbanistica",
        members: ["Avv. Cristina Pelliccia"],
    },
    {
        id: "assistenza-notarile",
        title: "Assistenza notarile",
        members: ["Notaio Dr. Emma Riella"],
    },
    {
        id: "assistenza-tecnica",
        title: "Assistenza tecnica",
        members: [
            "Arch. Stefania Cacia",
            "Geom. Andrea Cogliati",
            "Geom. Giambattista Lucchini",
            "Geom. Alberto Merio",
            "Ing. Mauro Volonté",
        ],
    },
    {
        id: "assistenza-fiscale",
        title: "Assistenza fiscale",
        members: [
            "Dr. Michela Agliati",
            "Dr. Claudia Brambilla",
            "Dr. Fabio Gambusera",
            "Dr. Valeria Pessina",
        ],
    },
    {
        id: "consulenza-lavoro",
        title: "Consulenza lavoro",
        members: ["Dr. Sergio Carraro"],
    },
    {
        id: "problemi-condominiali",
        title: "Assistenza problemi condominiali",
        members: ["Avv. Marco Barelli", "Geom. Davide Marelli", "Dr. Gabriele Tagliabue"],
    },
    {
        id: "assistenza-assicurativa",
        title: "Assistenza assicurativa",
        members: ["Rag. Boris Pulcinelli"],
    },
    {
        id: "consulenza-antincendio",
        title: "Consulenza antincendio",
        members: ["Ing. Federico Martinelli", "Arch. Pietro Moschioni"],
    },
];
