# Polisportiva Nino Romano Milazzo — V2

Nuova versione del sito ufficiale della Polisportiva Nino Romano Milazzo.

## Stack

- React, TanStack Start, TypeScript
- Tailwind CSS v4
- Cloudflare Workers / SSR

## Principi non negoziabili

- La V1 resta separata e non va modificata.
- Ogni contenuto pubblico, configurazione, immagine, link, ordine e visibilità deve poter essere gestito dal pannello editoriale senza interventi sul codice.
- Non inventare risultati, classifiche, calendario, roster, statistiche o dati societari.
- Non inserire credenziali, token o segreti nel codice.
- Non esporre un editor operativo finché autenticazione, autorizzazione server-side, persistenza, revisioni e audit non sono implementati e verificati.
- Nessuna integrazione backend/database o provisioning di servizi senza autorizzazione esplicita.
- Nessun merge o deploy senza autorizzazione esplicita.
- Netlify non è il target.

## Stato attuale

V2 è uno scaffold applicativo con pagine pubbliche, content contracts, dati locali di esempio/strutture vuote, validazione, policy di permessi pura e documentazione di architettura editoriale. **Non è ancora un pannello amministrativo funzionante**: non ci sono login, API di mutazione, persistenza, upload o preview protetta.

## Documentazione di progetto

- [Inventario contenuti pubblici](docs/public-content-inventory.md)
- [Architettura pannello editoriale](docs/editorial-admin-architecture.md)
- [Specifica UI editoriale](docs/editorial-admin-ui-spec.md)
- [Contratto News](docs/news-admin-contract.md)
- [Contratto dati revisioni News](docs/news-revision-data-contract.md)
- [Boundary sicurezza server](docs/editorial-server-boundary.md)
- [Strategia test admin](docs/admin-test-strategy.md)
- [Roadmap pannello](docs/editorial-panel-roadmap.md)
- [Registro decisioni tecniche](docs/editorial-panel-decision-register.md)
- [QA contenuti editoriali](docs/editorial-content-qa.md)
- [Release readiness](docs/release-readiness.md)

## Sviluppo

Build e type-check: `npm run build`.

La CI esegue build e type-check su pull request verso `main` e push al branch di sviluppo.
