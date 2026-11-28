# News adapter transaction and response contract

This is a binding implementation checklist for a future News repository adapter. It does not implement or authorize a provider, API, database or production authentication.

## Mutation invariants

The repository must enforce each invariant inside the same transaction (or equivalent atomic operation) as the state change and audit write:

- **Optimistic concurrency:** article/revision identity and expected version must match; stale requests return a stable conflict result without writes.
- **State transition:** validate the actual persisted state, not the client-supplied status. Each command is permitted only from the documented source state.
- **Separation of duties:** creator identity is read from the persisted revision. The reviewer must be a different verified actor for approve/reject; compare canonical IDs.
- **Publish gate:** only an approved revision may be published. Publication must update the public projection and audit record atomically.
- **Unpublish/archive/restore:** lifecycle operations and public projection changes are atomic with audit events.
- **Audit immutability:** user-facing repository commands cannot edit or delete historical audit events.
- **Idempotency:** duplicate retries must not create duplicate review or publication effects; define an idempotency key or equivalent behavior.
- **Failure atomicity:** on any write/audit/projection failure, rollback the whole operation; no partial state.

## Actor identity

The HTTP/server adapter must derive actor identity, role and session from a verified server-side session. It must not accept role, actor ID, creator ID, version, status or authorization flags as proof from the client. A provider-neutral service receiving an actor object is not an authentication boundary.

## Success DTO validation

Before exposing any successful repository response, the server service must validate its shape and allow-listed fields. Reject malformed or unexpected success payloads with a stable internal error; never serialize provider records directly.

For each operation, define an explicit DTO and guard:
- create/update/submit/review/publish/unpublish/archive/restore: exact envelope, identifiers, version, status and permitted metadata.
- read list: bounded page envelope, item guard, cursor.
- revision detail/history: explicit fields and stable pagination.
- audit: explicit actor/event/time/target fields and bounded pagination, never exposed in public DTOs.
- preview: revision-scoped content, read-only and authorization required.
- public article: explicit published projection only, no creator/session/audit/internal workflow fields.

## Required integration tests

- Simultaneous approve/reject attempts against the same revision: only one succeeds.
- Reviewer is rejected when reviewer ID equals persisted creator ID, including malformed client attempts to override creator.
- Stale expected version cannot overwrite newer revision.
- Failure injected at every transactional write stage leaves no partial revision, audit or public projection.
- Repeated requests with same idempotency key do not duplicate effects.
- Draft/rejected/archived revisions cannot leak through public query, preview or caches.
- Unpublish/archive removes public visibility in the same committed operation.
- Unexpected success payloads and provider exceptions are normalized and never exposed.
- Role/session revocation is respected at request time.

## Definition of adapter readiness

All invariants above must be enforced by an actual adapter and tested against an isolated integration environment. Unit tests for pure validators or mock repositories are not sufficient. Production use requires separate authorization for provider selection, provisioning, integration and deployment.
