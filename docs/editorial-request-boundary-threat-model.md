# Editorial request boundary threat model

This checklist applies before any CMS mutation or privileged editorial read is exposed. It is planning and review material, not an implemented control.

## Trust boundaries

1. **Browser/UI (untrusted):** all fields, route parameters, headers, role labels, article/revision IDs, status values, version numbers and submitted content can be manipulated.
2. **Server request boundary (trusted only after verification):** validates request shape, authenticates the session, derives the actor, checks authorization, CSRF/origin policy and rate limits.
3. **Application service:** receives a verified actor and validated command; applies permission and command policy; returns stable, minimal DTOs.
4. **Repository/transaction:** reads canonical persisted state and applies constraints, concurrency, separation-of-duties, state transitions and atomic audit/public-projection writes.
5. **Public rendering/cache:** reads a published-only projection. It must not be capable of accessing editorial revision or audit DTOs.

## Request-boundary checklist

- [ ] Reject absent, invalid, expired or revoked sessions; verify signatures/credentials using an approved adapter.
- [ ] Derive actor ID, role and session context server-side; never trust request-body identity or role.
- [ ] Check permission on every request, not just page navigation or button visibility.
- [ ] Apply CSRF protection for cookie-authenticated mutations and verify allowed origin as appropriate.
- [ ] Bound payload size, pagination and field lengths; reject unknown command keys.
- [ ] Rate-limit login, recovery, invitation and sensitive mutations.
- [ ] Normalize validation, authorization, conflict and internal error responses; avoid sensitive detail.
- [ ] Record audit metadata for mutations; avoid logging passwords, tokens or unnecessary personal data.
- [ ] Protect previews against public access, indexing, caching and replay; scope them to a revision and verified actor.
- [ ] Confirm authorization remains effective after role/session revocation.
- [ ] Prevent public cache from retaining a published article after unpublish/archive; verify cache invalidation strategy.
- [ ] Validate file upload type, size and actual file contents; use safe storage keys, scanning and metadata stripping where appropriate.

## Threat scenarios to test

| Threat | Required expected result |
|---|---|
| Client changes role or actor ID | Identity remains session-derived; deny or ignore spoofed fields |
| Direct request bypasses UI | Server permission check denies unauthorized command |
| Expired/revoked session | Request denied |
| Cross-site mutation | CSRF/origin controls prevent unauthorized state change |
| Editor requests publisher action | Denied |
| Creator tries to review own revision | Transactional repository denies |
| Concurrent review/publish | One consistent winner; other request conflicts |
| Stale version | Conflict with no partial writes |
| Audit write fails | Entire mutation rolls back |
| Draft ID queried publicly | No private revision disclosure |
| Preview link copied/replayed | Authorization and expiry still enforced |
| Malicious/oversized upload | Rejected before public availability |
| Provider exception | Stable safe error; sensitive details not returned |

## Security test completion criteria

Evidence must come from an actual isolated server integration environment and repository adapter. Mock-only unit tests and documentation cannot establish that these protections are active. Production enablement requires separate approval and a documented release check.
