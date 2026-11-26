# Editorial server boundary contract

This document is a security-oriented implementation checklist, not deployed code. No provider, database or credentials are selected here.

## Trust boundaries

- Browser: untrusted. All inputs, IDs, claimed roles, timestamps, workflow states, URLs, upload metadata and request headers can be manipulated.
- Server request boundary: authenticate every request, verify session validity/expiry/revocation and derive actor identity/roles from server-side session state.
- Editorial service: validates data, authorization, workflow transitions, ownership and optimistic concurrency.
- Persistence boundary: enforce transaction and constraints, including unique slugs and revision/audit integrity.
- Public read boundary: query published content only. Never return drafts, rejected revisions, archived content, audit records or user details to anonymous visitors.

## Request lifecycle for mutations

1. Verify session server-side and resolve actor ID and permissions.
2. Reject invalid, expired or revoked sessions; enforce CSRF protection as applicable.
3. Validate request shape, size limits and types; reject unknown fields rather than trusting browser-supplied workflow metadata.
4. Fetch target record and current revision in server scope; verify ownership/access scope.
5. Check role permission and transition using the shared fail-closed permission policy.
6. Validate and normalize the entire candidate record using shared validation plus server-specific checks.
7. Apply mutation with optimistic concurrency token and server-generated revision metadata.
8. Write append-only audit event in the same transaction. If either write fails, roll back.
9. Return minimal data and field-level errors; never expose secrets or internal stack traces.

## News-specific invariants

- Slug uniqueness is enforced by persistence and rechecked during mutation; handle concurrent collisions.
- Workflow status, published timestamp, actor identity and revision identity are server-controlled.
- A draft or review revision cannot be published through a direct request or forged payload.
- Preview access is authorized, scoped to a revision, short-lived, revocable and not indexed.
- Public article queries return published records and sanitize/validate rendering data.
- Archive/unpublish transitions follow policy; hard deletion is not the normal editorial operation.

## Media

- Allow-list formats; verify actual file signatures, not just extension or client MIME.
- Enforce size/dimension limits and rate limits; strip metadata where appropriate.
- Use server-generated object names and prevent path traversal.
- Avoid exposing private originals through public paths; define storage access policy before implementing uploads.
- Persist media metadata only after the upload is verified; alt text and decorative status are explicit.

## Session and administration safeguards

- Secure, HttpOnly and SameSite cookie settings, TLS, expiration and revocation.
- Authentication throttling and abuse monitoring.
- No self-escalation; protect last administrator.
- Role changes and invitations require privileged authorization and audit.
- Security headers and a reviewed CSRF strategy.
- Secrets are server-only; never send privileged credentials to browser code.
- Minimize personally identifying data in logs; redact tokens and credentials.

## Tests that must exist before exposing mutations

- Direct API attempts for each denied role/transition.
- Unknown roles, permissions, statuses and extra payload fields fail closed.
- Forged actor, role, publication date/status and revision fields are ignored or rejected.
- Expired/revoked session and CSRF tests.
- Slug race and revision-conflict tests.
- Transaction rollback when audit write fails.
- Public-read tests prove drafts, archived records and private media are inaccessible.
- Preview token scope, expiry and authorization.
- Upload file-signature, size, metadata and access-control tests.
- Last-admin protection, role change and invitation tests.

## Exit gate

Do not expose an operational editor or create publish/save controls until authentication, persistence, transaction/audit, server-side authorization and automated tests are implemented and reviewed. This contract does not authorize or perform integration with any provider, database, deployment or production service.
