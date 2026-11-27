# V2 database foundation

## Scope

This schema introduces the first relational persistence layer for the V2 website while preserving the existing `public.site_content` singleton as a public-only projection. It extends the existing `admin_users` allow-list with a role and active flag.

## Tables

- `admin_users`: existing authenticated-user allow-list, extended with `reader | editor | publisher | administrator` and an active flag.
- `seasons`: season metadata and current-season marker.
- `teams`, `team_members`, `team_staff`: normalized team and roster records.
- `events`: fixtures, training and club events, including results.
- `news_articles`, `news_revisions`: stable news identity and revision records.
- `media_assets`: metadata for objects in the existing `nrm-media` bucket.
- `club_profile`, `site_settings`: singleton JSON documents for structured club and site settings.
- `editorial_audit_log`: append-only audit history.

## Security model

RLS is enabled for every new public-schema table. Anonymous and ordinary authenticated visitors see only rows marked public/published. Editorial users can read the working records according to the role helper. Editors can create and edit unpublished non-news content; Publishers and Administrators can publish. Direct writes to news workflow tables are deliberately denied until the transactional server adapter and its RPC commands are implemented. Audit records are written by database triggers and cannot be changed through the Data API.

The role helper lives in the non-exposed `private` schema, derives the role only from `auth.uid()`, and is executable only by authenticated users. No role is read from user-editable JWT metadata.

The existing public Storage bucket remains public for reads. Upload/update/delete policies are narrowed from the old generic admin allow-list to Editor, Publisher and Administrator roles. File signature verification and server-generated object names remain application-layer requirements.

## Important implementation boundary

This schema is a foundation, not a finished production editorial backend. It does not create authentication users, assign anyone an admin role, expose news mutation RPCs, or connect the V2 routes to Supabase. In particular, `news_articles` and `news_revisions` are read-only to browser roles until atomic create/update/review/publish/unpublish/archive/restore commands are implemented and tested.

The existing `site_content` table is intentionally not repurposed for drafts: its current public SELECT policy means it must contain public content only.

## Application sequence

1. Apply the SQL as a versioned Supabase migration after confirming the project is healthy.
2. Run schema, RLS, Storage and advisor checks.
3. Add a trusted server authentication adapter and role resolver.
4. Implement transactional news commands and audit invariants.
5. Add repository adapters for teams, roster, events, club profile and settings.
6. Connect public routes to published-only reads and admin forms to server-side mutations.
7. Test anonymous leakage, role boundaries, concurrent revisions, audit immutability and rollback behavior.

## Notes

- PostgreSQL version expected: 17.
- Existing Storage bucket: `nrm-media`, public reads, 10 MiB cap, JPEG/PNG/WebP/AVIF.
- The SQL file in this directory is the reviewed schema source. It must be applied through a versioned migration, not pasted into an ad-hoc production SQL session.
- No seed content or first Administrator is inserted. Bootstrap must be a controlled operator action after a verified Auth user exists.
