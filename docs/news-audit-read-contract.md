# News audit read contract

Status: proposed integration contract. This is documentation only; audit reads are not implemented or exposed.

## Record allow-list

An adapter should return audit records with exactly these fields:

- `id`: non-empty stable identifier (maximum 128 characters)
- `articleId`: non-empty article identifier (maximum 128 characters)
- `actorId`: identifier of the authenticated actor recorded by the server (maximum 128 characters)
- `action`: enum, defined centrally for each editorial command; unknown actions fail closed
- `occurredAt`: valid ISO timestamp
- `revisionId`: nullable stable revision identifier (maximum 128 characters)
- `summary`: short, non-sensitive display summary (maximum 300 characters)

Do not include credentials, session tokens, raw request bodies, secrets, or unnecessary personal data. Avoid storing or returning IP addresses and user-agent strings unless a separately reviewed operational/legal requirement exists.

## Authorization and query rules

- Resolve the actor and role from a verified server session; client input is never identity proof.
- Audit access is restricted to authorized Publisher/Administrator roles according to the final permission matrix.
- Enforce article scope, deterministic ordering, bounded page size, and opaque cursor validation in the adapter.
- Audit events are append-only. Clients cannot create, edit, or delete audit entries.
- Public endpoints must never return audit data.
- Normalize provider failures; do not expose SQL, stack traces, or raw provider payloads.

## Validation and tests required before integration

- Exact allow-listed keys and field limits.
- Timestamp validity and identifier checks.
- Known action enum only.
- Page envelope and bounded size/cursor validation.
- Actor authorization, article scope, and denial for anonymous or unauthorized roles.
- No raw payload, token, or sensitive-field leakage.
- Stable pagination and append-only behavior.

This contract does not create an audit store, adapter, authentication system, or server endpoint.