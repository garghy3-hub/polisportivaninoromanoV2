# Pagine, homepage e profilo societario — rollout CMS

Questo documento definisce il passaggio dai workbench locali a contenuti editoriali condivisi. Non attiva né autorizza modifiche al database.

## Stato attuale verificato nel branch V2
- `/admin/pages` modifica homepage, pagine interne, menu, SEO e impostazioni sito in memoria e salva in `localStorage`.
- `/admin/society` modifica profilo, contatti, social, persone, sponsor/partner e testi della pagina Società; salva una bozza in `localStorage`.
- I due editor non sincronizzano dati tra dispositivi e non aggiornano il sito pubblico.
- La foundation migration prevede le tabelle singleton `public.site_settings` e `public.club_profile`, con `content jsonb`, `is_published`, `updated_by` e `updated_at`.
- La hardening migration prevede lettura pubblica solo delle righe pubblicate e lettura autenticata per utenti amministrativi attivi. Le policy RLS non sostituiscono RPC transazionali, versioning o audit.
- Non è stato verificato alcun flusso autenticato reale per questi due editor.

## Contratto dati
### Site settings
Persistire l'intero oggetto validato `SiteSettings` come un'unica revisione coerente. Include:
- metadati sito, lingua e Open Graph;
- brand preset e logo;
- navigazione e footer;
- contenuti homepage e sezioni ordinate;
- testi e metadati SEO delle pagine;
- etichette e configurazioni editoriali delle pagine News, Squadre, Calendario e Società.

### Club profile
Persistire l'oggetto `ClubProfile` come revisione coerente. Include:
- nome, descrizione, storia, missione e indirizzo;
- contatti e collegamenti social;
- persone, ruoli, biografie e ordinamento;
- sponsor e partner, tipologia, descrizioni, loghi e collegamenti.

La pagina Società contiene inoltre i propri testi, SEO e sezioni informative: deve essere salvata atomicamente con il profilo oppure versionata nello stesso aggregate, senza aggiornamenti parziali incoerenti.

## Requisiti prima dell'implementazione server-side
- Autenticazione Supabase verificata lato server e ruolo letto da `admin_users`.
- Validazione server-side riutilizzando i contratti esistenti; rifiuto di chiavi sconosciute e payload sovradimensionati.
- RPC con `SECURITY INVOKER` pubblico e implementazione privata `SECURITY DEFINER` con `search_path` fisso.
- Identità attore derivata esclusivamente da `auth.uid()`; nessun actor ID o ruolo accettato dal client.
- Versione attesa/`updated_at` per prevenire sovrascritture concorrenti.
- Salvataggio bozza, submit, approve/reject, publish/unpublish e audit log atomici.
- Separazione tra autore e revisore applicata nella funzione transazionale.
- Stato pubblicato esposto al pubblico solo tramite lettura pubblicata e allow-list dei campi.
- Protezione dei contenuti pubblicati: l'editor non deve poterli modificare direttamente prima di una nuova revisione.
- Nessun DML diretto dal browser sulle tabelle singleton; revoca esplicita dei privilegi e verifica delle policy.
- Preview non pubblica, autenticata e legata a una specifica revisione.
- Test di permessi, conflitti, rollback, audit e isolamento pubblico.

## Sequenza di lavoro proposta
1. Definire e testare validator stretti per `SiteSettings` e per l'aggregate `ClubProfile + SocietyPageContent`.
2. Definire le RPC e la migrazione per revisioni, stato editoriale, lock, grants e audit.
3. Implementare le server actions di lettura bozze, salvataggio, ripristino e workflow.
4. Collegare i workbench esistenti alle server actions, mantenendo messaggi chiari per loading, conflitti e rifiuti.
5. Collegare le pagine pubbliche alle sole revisioni pubblicate.
6. Applicare la migrazione solo dopo verifica dello schema effettivo e disponibilità del progetto Supabase.
7. Testare con account reali Editor, Publisher e Administrator; poi eseguire i test anonimi e pubblici.
8. Aggiornare la documentazione di release solo dopo aver verificato il flusso end-to-end.

## Vincoli di rilascio
- La presenza di una tabella o di una policy RLS non dimostra che l'editor sia operativo.
- Non applicare una migrazione basandosi soltanto sullo schema atteso nel repository.
- Non usare `localStorage` come fallback silenzioso quando il backend è configurato ma restituisce un errore.
- Non mostrare un messaggio di salvataggio riuscito prima della conferma del server.
- Non unire o distribuire il PR senza autorizzazione esplicita.
