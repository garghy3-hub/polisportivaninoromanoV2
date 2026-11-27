# Team editorial workflow — operational verification

This checklist applies to the team review/publication workflow added in the V2 branch. It is not evidence that these checks have already been performed.

## Migration order
1. Apply `20261127221500_team_review_publish_workflow.sql`.
2. Apply `20261127222500_team_editorial_lock_guards.sql`.
3. Apply `20261127223500_team_status_backfill.sql`.
4. Verify existing public teams retain `is_published = true` and `editorial_status = 'published'`.

## Role checks (authenticated test accounts required)
- Editor: save draft, submit draft/rejected team; cannot approve, reject, publish, or unpublish.
- Publisher: approve/reject in-review team, publish approved team, unpublish published team.
- Administrator: verify same transitions as publisher.
- Inactive admin user: no workflow commands or review queue access.
- Anonymous: no workflow commands or queue access.

## State and concurrency checks
- Reject requires a non-empty reason (maximum 1000 characters).
- Submit only from draft or rejected; approval/rejection only from in-review; publish only from approved; unpublish only from published.
- A stale `updated_at` must produce a conflict and not mutate content.
- Direct edits to team content and child roster/staff rows must be blocked while in-review, approved, or published.
- Publishing/unpublishing must update parent and child visibility flags atomically.
- Verify audit-log entries for each successful transition.

## Release boundary
Do not merge or deploy until the migration is applied and the authenticated tests above are completed. These checks are pending; CI alone does not validate database behavior or authenticated workflows.
