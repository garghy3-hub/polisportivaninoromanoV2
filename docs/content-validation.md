# Content validation rules

Use the validators in `src/lib/content-validation.ts` before importing or publishing editorial batches.

- `validateArticle`: required identifiers, slug, title/body, category/status and timestamps.
- `validateTeam`: required identifiers/name/slug, category and non-negative integer jersey numbers.
- `validateEvent`: event identity, parseable date, distinct home/away teams, recognized status and valid score for completed matches.
- `validateContentCollections`: duplicate IDs/slugs across articles, teams and events, plus duplicate roster/staff identifiers within each team.

These functions report issues without mutating data. Validation is not a substitute for editorial verification, authorization, database constraints or security policies.
