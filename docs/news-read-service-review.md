# News read service review

Status: review notes; no production adapter or server request boundary is present.

## Reviewed scope

- `src/lib/news-read-service.ts`
- `src/lib/news-read-repository.ts`
- `src/lib/news-read-query.ts`
- `src/lib/news-public-list-view.ts` and associated tests

## Positive controls

- Public list query rejects editorial-only fields and is bounded.
- Repository page envelopes and public projections are shape-validated.
- Public list and slug reads reject duplicate identifiers/slugs and slug mismatch.
- Provider errors are normalized rather than exposed to callers.
- Public view mapping is allow-listed and separate from editorial projection.

## Integration blockers / follow-up

1. **Audit payload validation:** `listAudit` validates only the generic page envelope. Before an adapter or route exposes this operation, define and validate a narrow audit-record schema and enforce actor authorization server-side. Do not expose audit reads through anonymous functions.
2. **Trusted identity:** `actorId` remains a scope parameter, not authentication. Resolve it from a verified server session and independently authorize each operation.
3. **Server composition:** keep repository/service imports server-only and expose only narrow server functions for public reads and separately authenticated editorial actions.
4. **Provider enforcement:** repository must enforce published-only filtering, deterministic bounded pagination, uniqueness, atomic/current projection semantics and authorization/scope—not merely rely on facade validation.
5. **Integration tests:** test missing configuration, client/server import separation, archived/unpublished exclusion, slug mismatch, malformed adapter payloads, and unauthorized access.
6. **Deployment content:** clearly label/remove local demo content before launch; never imply seeded fixtures are official club content.

## Scope

This review is not an implementation of authentication, database persistence, provider selection, credentials, or deployment. Those remain explicit decisions and authorization gates.
