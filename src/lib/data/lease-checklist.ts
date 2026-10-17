export interface ChecklistStep {
    id: string;
    title: string;
    items: readonly string[];
    note?: string;
}

export const LEASE_CHECKLIST: readonly ChecklistStep[] = [
    {
        id: "contratto",
        title: "Contratto di locazione",
        items: [
            "Almeno due copie firmate da locatore e conduttore.",
            "Marca da bollo da € 16 (dal 26.6.13) su ogni foglio con massimo di cento righe.",
            "Regolamento della casa ed oneri accessori firmato dal conduttore.",
            "Certificato energetico in originale.",
            "Denuncia di cessione e modello F24 vanno firmati dal solo locatore.",
        ],
        note: "Se il contratto è di durata inferiore a 30 giorni complessivi nell'anno, va registrato solo in caso d'uso.",
    },
    {
        id: "ricevuta",
        title: "Ricevuta per il canone e le spese",
        items: [
            "Da consegnare al conduttore.",
            "Oltre l'importo di € 77,47 è soggetta ad imposta di bollo di € 2 (dal 26.6.13).",
            "Le ricevute per sole spese condominiali sono esenti da bollo.",
        ],
    },
    {
        id: "certificazione-energetica",
        title: "Attestato di certificazione energetica",
        items: [
            "Da consegnare al conduttore esigendone ricevuta.",
            "Sono previste pesanti sanzioni economiche.",
        ],
    },
    {
        id: "cessione-fabbricato",
        title: "Denuncia di cessione di fabbricato",
        items: [
            "Da consegnare o spedire al Comune o alla Questura (nelle città sedi di Questure) solo per gli inquilini che non fanno parte dell'Unione europea.",
            "Entro 48 ore dalla consegna delle chiavi.",
        ],
    },
    {
        id: "f24-elide",
        title: "Modello F24 Elide",
        items: ["Pagare l'imposta di registro tramite banca o altro concessionario."],
    },
    {
        id: "ufficio-registro",
        title: "Da consegnare all'Ufficio Registro entro 30 giorni dalla stipula",
        items: [
            "Contratti firmati e bollati (bollo con data precedente a quella di stipula).",
            "Richiesta di registrazione.",
            "Mod. F24 Elide pagato (solo la copia per l'Ufficio).",
        ],
        note: "I contratti registrati vengono resi subito.",
    },
    {
        id: "dopo-la-registrazione",
        title: "Dopo la registrazione",
        items: [
            "Se sono state redatte solo due copie del contratto, consegnare al conduttore una fotocopia con timbro di registrazione visibile.",
        ],
    },
    {
        id: "scadenza-annuale",
        title: "Ad ogni scadenza annuale del contratto",
        items: [
            "Pagare con mod. F24 Elide l'imposta del 2% sul canone di locazione aggiornato ISTAT.",
        ],
    },
];

export const LEASE_CHECKLIST_NOTICE =
    "Ricordiamo che l'Associazione offre ai soci il servizio di assistenza nella stesura dei contratti di locazione. Disponibile la modulistica per la cedolare secca.";
