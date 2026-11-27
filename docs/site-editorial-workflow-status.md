# Stato operativo — CMS Pagine e contenuti istituzionali

Aggiornato al 27 novembre 2026. Questo documento distingue il codice presente nel branch dallo stato effettivo del database e del sito pubblico.

## Implementato nel branch V2
- `site_editorial_command`: RPC transazionale per `site_settings` e `club_profile`, con controllo del ruolo, optimistic concurrency, audit log, invio in revisione, approvazione/rifiuto, pubblicazione e ritiro.
- La colonna `content` conserva la versione pubblica; `draft_content` contiene la bozza. La pubblicazione copia la bozza in `content`; il ritiro preserva il contenuto come nuova bozza e rimuove la visibilità pubblica.
- I privilegi browser di scrittura diretta sulle due tabelle sono revocati nella migrazione; anon può leggere soltanto le colonne della proiezione pubblica e resta soggetto a RLS.
- Server actions per salvataggio, lettura bozze e workflow, con verifica server-side dell'identità e del ruolo, validazione payload e normalizzazione degli esiti RPC.
- Editor Pagine collegato al salvataggio condiviso e all'invio in revisione; la rotta `/admin/site-review` consente a Publisher/Admin approvazione, rifiuto motivato, pubblicazione e ritiro.
- Tipi Supabase aggiornati e voce di navigazione amministrativa aggiunta.

## Non ancora completato
- La migrazione `20261127224500_site_editorial_workflow.sql` è nel repository ma **non è stata applicata né validata su PostgreSQL**.
- La pagina pubblica non è ancora collegata a una lettura server-side delle revisioni pubblicate di `site_settings`; la pubblicazione DB non va quindi considerata già visibile nel sito.
- L'editor Società resta un prototipo locale. Il salvataggio congiunto di profilo e testi della pagina Società deve essere realizzato come aggregate atomico prima di dichiararlo condiviso.
- Mancano account Auth editoriali reali, test integrati per ruoli Editor/Publisher/Admin, test SQL di rollback/concorrenza/RLS e verifica cross-device.
- Per l'head corrente GitHub non restituisce workflow run né combined status: build, typecheck e test non sono quindi dichiarabili superati per questo blocco.
- Il media management resta separato: URL e metadati non sostituiscono un upload remoto verificato.

## Gate prima dell'uso operativo
1. Verificare lo schema live, grants, policy e migration history.
2. Revisionare e applicare la migrazione in ambiente di test, dopo restore autorizzato del progetto Supabase.
3. Testare anonimo, Editor, Publisher e Administrator; verificare separazione autore/revisore, conflitti, audit e rollback.
4. Implementare la lettura pubblica server-side e collegare le pagine pubbliche.
5. Implementare l'aggregate Società con salvataggio e workflow atomici.
6. Eseguire build, typecheck e test CI; completare QA browser e accessibilità.
7. Solo dopo autorizzazione esplicita, pianificare merge e deploy.

## Stato release
PR #1 resta Draft. Nessuna migrazione di questo blocco è stata applicata; nessun merge o deploy è stato eseguito.
