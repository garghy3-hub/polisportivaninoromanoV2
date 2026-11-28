# Area amministrativa V2 — stato e guida

Aggiornato al 28 novembre 2026. Questo documento distingue il codice presente nel branch, lo stato delle migrazioni e le verifiche effettivamente eseguite.

## Accesso e sicurezza

- Le route amministrative usano sessione Supabase verificata server-side e allow-list admin_users; il ruolo non viene accettato dal client.
- Le server actions dei moduli editoriali verificano attore e ruolo prima di invocare le RPC.
- Le protezioni SQL di News, Squadre e Calendario applicano controlli di ruolo, transizioni e concorrenza secondo le rispettive migrazioni.
- La presenza di route, componenti e RPC nel branch non equivale a un flusso autenticato collaudato: non è ancora stato creato/verificato un account Auth editoriale reale e non sono stati completati test end-to-end con i ruoli.

## Stato per area

- **News:** codice server-side per bozze, revisione, pubblicazione e lettura pubblica presente nel branch; migrazioni News presenti nel registro remoto. Restano da verificare i flussi autenticati reali e la lettura pubblica nel runtime distribuito.
- **Squadre:** editor e workflow server-side per bozze/revisione/pubblicazione presenti; migrazioni di workflow presenti nel registro remoto. Test unitari disponibili, ma nessun collaudo end-to-end autenticato.
- **Calendario:** azioni e workflow server-side presenti; migrazione editoriale presente nel registro remoto. Nessun collaudo end-to-end autenticato.
- **Pagine e homepage:** editor collegato alle server actions per bozza condivisa e invio in revisione. La migrazione 20261127224500_site_editorial_workflow.sql è nel repository ma non risulta applicata nel registro remoto consultato il 28 novembre. La pubblicazione è intenzionalmente bloccata finché la proiezione pubblica server-side non è pronta.
- **Società / profilo club:** la migrazione e le server actions prevedono il workflow club-profile, ma il collegamento completo dell'editor e il salvataggio atomico dei contenuti della pagina Società non sono completati.
- **Media:** Media Library usa IndexedDB nel browser; upload e storage remoto sicuro non sono completati.
- **Brand/footer:** workbench locale con anteprima e validazione; persistenza editoriale condivisa non verificata.
- **Dashboard e navigazione:** forniscono accesso alle aree CMS, ma non costituiscono da sole un controllo di sicurezza.

## Persistenza: distinguere prototipo e server

- News, Squadre e Calendario hanno componenti server-side e contratti RPC nel branch; il livello di verifica varia in base alle migrazioni effettivamente applicate.
- Le impostazioni Pagine/Homepage hanno codice per bozza condivisa server-side, ma la relativa migrazione non è applicata: non considerare il salvataggio operativo sul database finché non sarà verificato in un ambiente di test.
- Media Library resta locale al browser/dispositivo tramite IndexedDB.
- Non presentare mai un salvataggio locale come sincronizzato o pubblicato sul sito.

## Gate ancora aperti

- [ ] Creare e verificare account Auth editoriali reali per Editor, Publisher e Administrator.
- [ ] Eseguire test autenticati di accesso, ruoli, separazione autore/revisore, conflitti, audit e transizioni.
- [ ] Revisionare e applicare in ambiente di test la migrazione Pagine/Società, dopo verifica dello schema live e delle dipendenze.
- [ ] Implementare e verificare la lettura pubblica server-side delle impostazioni pubblicate prima di abilitare la pubblicazione Pagine.
- [ ] Completare l'aggregate Società con salvataggio e workflow atomici.
- [ ] Implementare storage remoto per i media con policy e autorizzazioni verificate.
- [ ] Eseguire QA browser desktop/mobile, accessibilità, errori di rete e verifica cross-device.
- [ ] Abilitare la protezione Supabase Auth contro password compromesse e verificare le impostazioni di sicurezza.
- [ ] Completare privacy, contenuti ufficiali, dominio, backup e piano di rollback prima del rilascio.

## Stato release

PR #1 resta Draft. Il branch non è stato unito né distribuito. Il progetto Supabase risultava INACTIVE nell'ultimo controllo; non è stato riattivato. Nessun flusso autenticato reale è dichiarato collaudato.
