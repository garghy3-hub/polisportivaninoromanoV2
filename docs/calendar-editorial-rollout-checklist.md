# Calendar editorial rollout checklist

This checklist is a release gate, not evidence that the workflow is already active. The branch contains calendar draft and workflow RPCs, but authenticated end-to-end behavior and the live public projection remain unverified.

## Data contract

- Map the UI labels explicitly: `Partite` → `match`, `Attività societarie` → `club-event`, `Eventi` → `other`.
- Preserve the database enum values: `match`, `training`, `club-event`, `other`.
- Store all event timestamps as timezone-aware instants; the editor must interpret the entered local time in the venue timezone.
- Keep event status separate from editorial status. A completed match requires verified non-negative integer scores.

## Persistence and authorization

- Revoke direct browser INSERT/UPDATE/DELETE on `public.events`.
- Save an event and its audit entry atomically through an authenticated RPC.
- Derive actor identity and role from the verified Supabase session, never from request data.
- Enforce optimistic concurrency using `updated_at`.
- Editors may create/update drafts and submit them; publishers/administrators may approve, reject, publish and unpublish.
- Reject requires a non-empty review note. Invalid transitions fail closed.
- Public reads must continue to return published events only, and only for published seasons.
- Decide whether the event creator may approve/reject their own submission. The current calendar workflow RPC does not enforce creator/reviewer separation; if self-review is prohibited, add a database-level guard and tests before release.

## Verification before activation

- Apply migrations in order in the intended Supabase project and verify function security, grants and RLS.
- Test anonymous, reader, editor, publisher, administrator and inactive-admin behavior.
- Test draft create/update, stale update conflict, submit, approve, reject, publish and unpublish.
- Verify completed-match score constraints, event-type mapping, season lookup and timestamp handling.
- Verify event data and audit log commit or roll back together.
- Verify public queries never expose drafts, rejected items or unpublished events.
- Run unit tests, database integration tests and a real authenticated end-to-end workflow.

## Release boundary

Do not merge or deploy until migrations, authenticated tests, public projection checks, the self-review policy and rollback procedures are complete. A local prototype or successful build is not proof of a working editorial workflow.
