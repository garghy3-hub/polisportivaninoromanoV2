# Admin test strategy

This plan is a prerequisite for implementing authenticated editorial mutations. It is not a substitute for tests or server-side enforcement.

## Test layers

### 1. Pure unit tests
- Permission matrix: each permission against Reader, Editor, Publisher and Administrator.
- Invalid/unknown role and permission values deny access.
- Revision transitions: every listed transition and representative unlisted transitions; same-state transitions denied.
- Content validators: valid records, missing required fields, malformed URLs, invalid dates/scores, duplicate IDs/slugs, unsafe media metadata and inaccessible states.
- Query rules: public queries exclude hidden, draft, archived and cancelled items where applicable.

### 2. Server boundary tests (before any editing screen is exposed)
- Anonymous requests cannot access editorial reads or mutations.
- A session with expired, revoked or invalid signature is denied.
- Role and actor identity are derived from the verified session, never request-body values.
- Each mutation checks permissions at the server boundary, including direct requests bypassing UI.
- Editors cannot review/publish; publishers cannot administer roles/settings; only administrators can perform privileged role/settings actions.
- CSRF and rate-limit behavior are tested for applicable session/auth routes.
- Resource ownership/scope is enforced.

### 3. Workflow and transactional tests
- Draft create/update, submit, approve/reject, publish, unpublish, archive and restore follow the documented state machine.
- Revision and audit writes commit together or roll back together.
- Concurrent updates cannot silently overwrite a newer revision (optimistic concurrency/version check).
- Last-admin protection is atomic and tested under concurrent role-change requests.
- Audit events are immutable from application-facing user operations.

### 4. Public rendering and preview
- Public endpoints return published content only.
- Preview is revision-scoped, expires, and cannot be reused by an anonymous or unauthorized user.
- Preview uses the public rendering components and validates content identically.
- Verify every editable inventory item changes the intended rendered surface without source-code changes.
- Check responsive behavior, keyboard focus, screen-reader labels, alt text and empty/error states.

### 5. Release and operational checks
- CI runs unit, server-boundary, workflow, validation and build/type-check jobs.
- No credentials or privileged server secrets are present in client bundles.
- Backup restore, rollback and audit-retention procedures are exercised.
- Production deployment remains a separate approved action.

## Implemented unit coverage

- Vitest is installed and `npm run test` runs the unit suite.
- CI runs unit tests before build/type-check.
- Pure permission and workflow transition rules are tested.
- Content, query and News draft validation have unit coverage.
- `editorial-session.test.ts` covers the fail-closed resolution of a server-loaded session record, expiry, revocation, unknown roles and permission checks.
- `news-editorial-service.test.ts` covers server-service permission gates, category/field validation, expected-version checks and repository delegation for create, update and submit operations.

The session helper is not an authentication implementation: it does not verify cookies, signatures, passwords, session storage or the source of the supplied record. Its input must come from a future trusted server-side authentication adapter.

The read-side contract in `docs/news-repository-read-contract.md` also defines required future tests for pagination, preview read-only behavior, public projection filtering, audit access restrictions and deterministic history.

## Remaining CI and security work

1. Keep unit tests and build/type-check as required CI gates.
2. When server services exist, add boundary and transaction integration tests using an isolated test environment.
3. Add end-to-end editorial/public rendering tests only after authentication and persistence are implemented.
4. Verify denied direct API requests, CSRF, rate limits, session revocation and role spoofing at the actual server request boundary.

## Current status

The repository has a Vitest unit suite and CI runs tests before build/type-check. It still has no authenticated server API, production session verification or persistence. Existing admin routes remain non-persisting prototypes.
