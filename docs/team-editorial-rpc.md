# Team editorial draft RPC

The team editor now has a server-side draft save path. The migration
`20261127210000_team_editorial_drafts.sql` creates
`public.team_editorial_command`, a SECURITY INVOKER wrapper over a private
SECURITY DEFINER implementation.

## Command contract

Only `save_draft` is currently supported. The database independently verifies
that the caller is authenticated and has an active `editor`, `publisher`, or
`administrator` row in `public.admin_users`.

The payload is an exact-key aggregate:

- `name`, `slug`, `category`, `seasonLabel`, `description`
- `roster[]`: `name`, `jerseyNumber` (integer 0–99 or null), `role`
- `staff[]`: `name`, `role`

Limits: 100 roster entries, 30 staff entries, unique non-null jersey numbers,
and a unique slug within a season. Existing drafts use optimistic concurrency
through `expected_updated_at`. Team, roster, staff and audit-log writes happen
in one transaction.

Direct browser INSERT/UPDATE/DELETE privileges on the three team tables are
revoked. Public and editorial reads remain governed by their existing RLS
policies. The public page separately filters published teams, seasons, roster,
staff and media.

## Current limitations

- The migration is committed but has not been applied to Supabase: the project
  is currently inactive.
- The admin editor stores the last server team ID and version in this browser
  to update the same draft. A cross-device draft library and remote reload
  workflow are still pending.
- Team/roster/staff image URL fields are not written to the database. Server
  media upload and media-asset selection must be completed before images can
  be attached without risk of losing references.
- There is no team review/publish/unpublish command yet. Saving a draft never
  makes it public.
