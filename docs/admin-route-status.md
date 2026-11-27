# Area amministrativa V2 — stato e guida

## Accesso alla struttura
La route `/admin` contiene una panoramica delle aree CMS previste. Le route `/admin/news`, `/admin/teams`, `/admin/calendar`, `/admin/pages`, `/admin/society` e `/admin/brand` sono workbench UI locali per preparare e verificare contenuti e impostazioni, ma non salvano dati e non costituiscono un sistema autenticato. La route `/admin/media` espone per ora soltanto la struttura prevista per la libreria.

## Stato attuale
- [x] Route dashboard introdotta
- [x] Aree di gestione elencate: News, squadre/roster, calendario/risultati, pagine/home, media, brand/footer, società/contatti, utenti/audit
- [x] Flusso editoriale descritto
- [x] Workbench locale brand/footer con anteprima e validazione (senza persistenza)
- [ ] Autenticazione reale e sessioni verificate
- [ ] API server protette e autorizzazioni server-side
- [ ] Persistenza di revisioni e contenuti
- [ ] Media upload con storage sicuro
- [x] Prototipi UI locali News, squadre/roster, calendario/risultati, pagine/home e società (senza persistenza)
- [ ] Flusso News con revisioni e pubblicazione effettive
- [ ] Pubblicazione atomica e audit trail
- [ ] Test d'integrazione e sicurezza

## Vincoli
Non aggiungere form che fingano di salvare o pubblicare contenuti. Le UI interattive per la gestione devono essere collegate a servizi server e mostrare chiaramente gli stati di errore, loading e conferma. La route dashboard informativa non è un gate di sicurezza: prima dell'attivazione, il server dovrà verificare sessione e autorizzazioni su ogni richiesta.

## Primo vertical slice
Implementare News come primo modulo, rispettando `docs/news-admin-contract.md`, `docs/news-revision-data-contract.md` e `docs/editorial-server-boundary.md`. Prima di scegliere provider per sessioni, database e storage, risolvere le decisioni aperte in `docs/editorial-panel-decision-register.md`.

## Checkpoint di sicurezza — 27 novembre 2026
- Il servizio editoriale News valida input, autorizzazioni, identificativi/versioni e transizioni prima di delegare al repository.
- Il servizio normalizza le risposte di errore del repository, non espone messaggi arbitrari del provider e tratta codici sconosciuti come errore interno.
- Queste protezioni non sostituiscono un repository transazionale, autenticazione verificata, enforcement della separazione dei compiti o API server: sono ancora da implementare.
- La CI GitHub Actions sul commit `d48d41c1f7b72094aee42dfcf306f892fc83f462` è risultata completata con esito positivo (build check).
- PR #1 resta draft: nessun merge o deploy eseguito.
