# News repository read contract

This document defines the read-side boundary for the future transactional News adapter. It is intentionally provider-neutral: it does not add a persistence provider, database schema, API endpoint, or authentication implementation.

## Read operations required

A repository implementation should provide these server-side operations before the News panel can be considered usable:

- **List work items**: paginated, bounded query with filters for status, category, creator and date; stable ordering; no unbounded scans.
- **Get revision detail**: article identity and requested revision snapshot, including review/publication metadata.
- **Revision history**: chronological revisions for an article, with pagination and stable identifiers.
- **Audit history**: append-only audit entries scoped to an article, with pagination; only actors authorized to read audit may access it.
- **Public article read**: return only the currently published projection, never draft/review/archived snapshots.
- **Preview**: render a selected revision for an authenticated editorial actor without changing publication state or exposing it to public routes.

## Authorization and data minimization

- Derive the actor from the verified server-side session; never accept role, actor ID or permissions from request payloads.
- Enforce authorization in the server boundary and repository, not merely in UI visibility.
- Editor work queues should be limited to records in the actor's permitted scope; publishers/admins may have wider review scope according to policy.
- Audit data is publisher/admin-only under the current role model.
- Preview URLs must be unguessable if they are ever shared, short-lived or protected by authorization, and must not be indexed.
- Public read queries must filter on the publication projection rather than infer public visibility from a revision status.
- Apply pagination, field projection and server-side filtering; never return audit or internal revision metadata to public clients.

## Query and consistency requirements

- Use deterministic ordering (timestamp plus stable ID tie-breaker). The provider-neutral helper `src/lib/news-read-order.ts` sorts creation timestamps descending and IDs ascending for ties; adapter implementations should validate record timestamps and identifiers before use.
- Cursor or offset pagination must be bounded and validated.
- History and audit queries must not silently omit entries due to unstable ordering.
- Public reads and publication mutations must observe a consistent projection.
- Avoid exposing provider-specific errors; normalize failures at the server boundary.
- A preview is read-only and must not create audit mutations unless a separate preview-access audit policy is explicitly implemented.

## Query validation foundation

`src/lib/news-read-query.ts` provides a provider-neutral validator for bounded page size, opaque cursor length, status, category and search filters. Unit tests cover defaults and invalid values. This is input validation only; it does not query data, enforce permissions, or implement pagination.

## Acceptance checklist for the adapter

- [ ] Unauthorized read attempts fail closed.
- [ ] Public read never exposes draft, in-review, rejected or archived content.
- [ ] Public read reflects unpublish/archive atomically.
- [ ] Revision history and audit pagination are deterministic.
- [ ] Audit reads are permission-restricted.
- [ ] Preview is read-only and cannot be used to publish.
- [ ] Queries have limits and validated filters.
- [ ] Automated tests exercise access denial and data-leak prevention.

## Current status

The News workbench and service operations remain prototypes/contracts. No repository read adapter, authentication provider, persistence, API or protected preview is currently implemented. This contract does not claim that any of these capabilities are live.
