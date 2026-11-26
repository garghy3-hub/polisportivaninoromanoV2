# Area amministrativa V2 — stato e guida

## Accesso alla struttura
La route `/admin` contiene una panoramica delle aree CMS previste. Le route `/admin/news`, `/admin/teams` e `/admin/calendar` sono workbench UI locali per preparare e verificare bozze, ma non salvano dati e non costituiscono un sistema autenticato.

## Stato attuale
- [x] Route dashboard introdotta
- [x] Aree di gestione elencate: News, squadre/roster, calendario/risultati, pagine/home, media, brand/menu/footer, società/contatti, utenti/audit
- [x] Flusso editoriale descritto
- [ ] Autenticazione reale e sessioni verificate
- [ ] API server protette e autorizzazioni server-side
- [ ] Persistenza di revisioni e contenuti
- [ ] Media upload con storage sicuro
- [x] Prototipi UI locali News, squadre/roster e calendario/risultati (senza persistenza)\n- [ ] Editor News con preview e revisioni
- [ ] Pubblicazione atomica e audit trail
- [ ] Test d'integrazione e sicurezza

## Vincoli
Non aggiungere form che fingano di salvare o pubblicare contenuti. Le UI interattive per la gestione devono essere collegate a servizi server e mostrare chiaramente gli stati di errore, loading e conferma. La route dashboard informativa non è un gate di sicurezza: prima dell'attivazione, il server dovrà verificare sessione e autorizzazioni su ogni richiesta.

## Primo vertical slice
Implementare News come primo modulo, rispettando `docs/news-admin-contract.md`, `docs/news-revision-data-contract.md` e `docs/editorial-server-boundary.md`. Prima di scegliere provider per sessioni, database e storage, risolvere le decisioni aperte in `docs/editorial-panel-decision-register.md`.