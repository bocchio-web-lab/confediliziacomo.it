export interface BoardRole {
    title: string;
    members: readonly string[];
}

export interface BoardSection {
    id: string;
    title: string;
    roles: readonly BoardRole[];
}

export const BOARD_TERM = "in carica per tre anni dal 2023";

export const BOARD_SECTIONS: readonly BoardSection[] = [
    {
        id: "presidenza",
        title: "Presidenza",
        roles: [
            { title: "Presidente", members: ["Avv. Claudio Bocchietti"] },
            {
                title: "Vice Presidenti",
                members: ["Ing. Giancarlo Bernasconi", "Avv. Angelo Sollazzo"],
            },
            { title: "Tesoriere", members: ["Dr. Fabio Gambusera"] },
            { title: "Segretaria", members: ["Avv. Elena Vimercati"] },
        ],
    },
    {
        id: "consiglieri",
        title: "Consiglieri",
        roles: [
            {
                title: "Consiglieri",
                members: [
                    "Avv. Simona Cantoni",
                    "Dr. Alessandro Colombo",
                    "Geom. Alessandro Della Torre",
                    "Rag. Felice de Paoli",
                    "Rag. Marco Fascendini",
                    "Rag. Ombretta Figini",
                    "Avv. Alberto Lovisetti",
                    "Arch. Gianmarco Martorana",
                    "Avv. Cristina Pelliccia",
                    "Avv. Giovanni Raitò",
                ],
            },
        ],
    },
    {
        id: "revisori",
        title: "Revisori dei conti",
        roles: [
            {
                title: "Revisori dei conti",
                members: [
                    "Dr. Antonella Bresciani",
                    "Dr. Giacomo Frigerio",
                    "Dr. Valeria Pessina",
                ],
            },
        ],
    },
];
