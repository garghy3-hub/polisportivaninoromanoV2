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

RLS is enabled for every new public-schema table. Anonymous and ordinary authenticated visitors see only rows marked public/published. Editorial users can read the working records according to the role helper. Editors can create and edit unpublished non-news content; Publishers and Administrators can publish. Direct writes to news workflow tables are deliberately denied until the transactional server adapter and its RPC commands are implemented. Audit records are readable only by Publisher/Administrator roles and cannot be changed through the Data API. Trusted server-side transactional commands must append audit rows alongside each mutation; database triggers are not yet installed.

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
- The applied SQL is tracked in `supabase/migrations/`; the explanatory copies in `docs/` remain readable references. Generated TypeScript database types live in `src/lib/supabase/database.types.ts`.
- No seed content or first Administrator is inserted. Bootstrap must be a controlled operator action after a verified Auth user exists.


## Transactional news workflow

The tracked migrations `20261127191120_news_editorial_rpc` and `20261127191156_news_rpc_private_definer` add:

- `news_articles.current_revision_id` as the current editorial revision pointer.
- `news_public_articles`, a security-invoker public view that exposes only the published projection.
- Anonymous column-level grants limited to the public article/revision fields; author, reviewer, review-note, audit and current-draft metadata remain unavailable to anonymous clients.
- `public.news_editorial_command`, a SECURITY INVOKER RPC entry point.
- `private.news_editorial_command`, the SECURITY DEFINER implementation in the non-exposed `private` schema. It derives the actor from `auth.uid()`, checks the active allow-list role, performs optimistic version checks, enforces reviewer/creator separation, and appends the audit row in the same transaction.
- Direct browser INSERT/UPDATE/DELETE privileges on the news revision and audit tables remain revoked.

The Supabase security advisor no longer reports an exposed SECURITY DEFINER function. The remaining Auth warning is leaked-password protection being disabled.
