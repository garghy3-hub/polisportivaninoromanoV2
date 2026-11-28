# Team editorial workflow RPCs

The V2 branch contains a database-backed team draft and review/publication workflow. The SQL migrations define private transactional implementations behind SECURITY INVOKER public wrappers.

## Commands and migrations

- `20261127205900_team_editorial_drafts.sql`: `public.team_editorial_command` supports `save_draft`.
- `20261127221500_team_review_publish_workflow.sql`: `public.team_editorial_workflow_command` supports `submit`, `approve`, `reject`, `publish` and `unpublish`.
- `20261127222500_team_editorial_lock_guards.sql`: protects team records during review and publication.
- `20261127223500_team_status_backfill.sql`: aligns existing published teams with the editorial status model.

The last recorded remote migration-ledger snapshot contained the draft and workflow migrations under their remote versions. The Supabase project is currently inactive, so no live verification can be performed until it is active again.

## Draft command contract

The payload is an exact-key aggregate:

- `name`, `slug`, `category`, `seasonLabel`, `description`
- `roster[]`: `name`, `jerseyNumber` (integer 0–99 or null), `role`
- `staff[]`: `name`, `role`

Limits: 100 roster entries, 30 staff entries, unique non-null jersey numbers and a unique slug within a season. Existing drafts use optimistic concurrency through `expected_updated_at`. Team, roster, staff and audit-log writes happen in one transaction.

## Workflow and authorization

The database independently derives the actor from `auth.uid()` and checks for an active editorial role. Editors may save and submit drafts; publishers and administrators may approve/reject, publish and unpublish. The workflow locks the team row, checks the expected timestamp, updates parent/child publication flags and appends the audit event in the same transaction.

Direct browser INSERT/UPDATE/DELETE privileges on the three team tables are revoked. Public and editorial reads remain governed by their RLS policies. The public page separately filters published teams, seasons, roster, staff and media.

## Remaining verification and limitations

- The project is currently inactive; the last migration-ledger snapshot is not a substitute for a fresh live check.
- No real Reader, Editor, Publisher and Administrator accounts have completed authenticated end-to-end testing.
- Review/publish RPC behavior, transaction rollback, audit atomicity, optimistic concurrency and public projection must be tested against a non-production database.
- The current team workflow RPC does not compare the submitter/creator with the reviewer. Decide whether self-review must be prohibited, then enforce that policy in the database and test it before production use. Apply the same decision consistently to calendar and News.
- The admin editor stores the last server team ID and version in this browser to update the same draft. A cross-device draft library and remote reload workflow are still pending.
- Team/roster/staff image URL fields are not written to the database. Remote media upload and media-asset selection remain incomplete.

Saving a draft never makes it public; publication requires the separate workflow command.
