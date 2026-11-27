# Editorial panel implementation roadmap

Prioritized implementation sequence for the V2 editorial panel. Provider selection and database integration remain deliberately deferred.

## Phase 0 — contracts (complete as planning documents)
- Public content inventory and full-editability requirement.
- Permission model, revision transition model and news vertical-slice contracts.
- Server-boundary/security checklist and test strategy.
- UI specification and resource field mapping.

## Phase 1 — prerequisites (must be decided before operational panel)
- Choose and approve authentication/session approach.
- Choose and approve persistence and transactional audit mechanism.
- Define media storage and upload scanning/validation.
- Define deployment environment, secret handling, backups and recovery.
- Review data protection, administrator invitation and account recovery.
- [x] Implement CI test runner and unit-level permission/session/service boundary tests.
- [ ] Complete integration-level security tests against a real authenticated server and transactional persistence.
- [ ] Enforce separation of duties in the transactional repository: the reviewer must differ from the revision creator; test approval and rejection paths, including concurrent attempts.
- [ ] Validate repository success payloads at the service boundary before exposing them; malformed success records must fail closed.
- [ ] Verify actor attribution is sourced only from verified server sessions, not request payloads or revision content.

## Phase 2 — news vertical slice

**Security gates before enabling any mutation UI:** verified server-side sessions; authorization per request; creator/reviewer separation enforced transactionally; exact revision/version checks; validated repository response envelopes; immutable audit records; protected preview; and public projection isolation. Unit tests alone are insufficient.
- Authenticated admin shell and navigation.
- News list, filtering and pagination.
- Accessible create/edit forms, client-side validation and server-side validation.
- Revision history, preview and conflict handling.
- Submit, review, approve, reject, publish, unpublish and archive actions.
- Atomic audit trail; public content adapter reads only published projection.
- Integration and end-to-end tests, accessibility checks.

## Phase 3 — reuse for remaining resources
1. Teams and roster/staff.
2. Calendar and match results.
3. Club profile, people, contacts and sponsors/partners.
4. Homepage, standard pages, navigation and footer.
5. Media library and asset picker.
6. Site/SEO/social settings and controlled brand presets.

## Phase 4 — operational hardening
- Role management, invitation, recovery and last-admin safeguards.
- Monitoring, audit review, backup/restore drills and incident procedures.
- Performance, mobile, accessibility and privacy review.
- Release checklist and staged deployment, only with explicit authorization.

## Definition of done for any resource
- Every public field identified in inventory is editable by an authorized role.
- Validation and accessible field-level feedback.
- Preview reflects the candidate revision, clearly marked unpublished.
- No role/actor/status trust from client requests.
- Revision concurrency and history.
- Audit and content changes are transactional.
- Public access limited to published content.
- Tests cover permission-denied and failure paths, creator/reviewer separation, malformed adapter outputs, race conditions and transaction rollback.
- No fabricated club information.
- Release and deployment authorization explicitly obtained.

## Current status
- Phase 0 contracts are documented.
- Phase 1 is partially complete: Vitest runs in CI; pure permission/session helpers and a provider-neutral News service boundary cover draft creation, updates, review decisions, publication, unpublication, archive and restore commands. Unexpected repository errors are normalized before returning to callers. The service has no HTTP endpoint, trusted authentication adapter or repository implementation.
- Phase 2 UI workbenches exist as local, non-persistent prototypes. They are not connected to the News service and do not save or publish content.
- Read-side News requirements (work queue, revision history, audit history, public projection reads and protected preview) are documented in `docs/news-repository-read-contract.md`; they are not implemented.
- Authentication, persistence, media storage, transactional audit, public projection integration and operational hardening remain unimplemented.
- No provider, database, auth or deployment has been chosen or connected.
