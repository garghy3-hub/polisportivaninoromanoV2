# Editorial authentication implementation

## Implemented

- Supabase SSR browser and server clients use pinned `@supabase/ssr@0.12.7` and `@supabase/supabase-js@2.119.2`.
- Server client is request-scoped and uses the TanStack Start cookie helpers to read the incoming cookie jar and append refreshed cookies/headers to the response.
- Auth flow uses PKCE.
- `getCurrentEditorialUserFn` validates the access token with Supabase `auth.getClaims()`; it does not trust `getSession().user`.
- The authenticated subject is matched against `public.admin_users`. Only active allow-list rows with one of the four supported roles are accepted. User-editable metadata is never consulted for authorization.
- `editorialLoginFn` uses Supabase password authentication and checks the allow-list before admitting the user. Authenticated accounts without an active allow-list entry are signed out.
- `editorialLogoutFn` signs out the local session.
- `/admin/login` provides the login screen. There is no public sign-up route.
- The root route checks every `/admin/*` URL server-side, excluding only `/admin/login`. Admin responses are marked `private, no-store`.
- The admin navigation includes sign-out.
- News create/update/submit/review/publish/unpublish/archive/restore server functions use the transactional Supabase RPC. The RPC independently verifies `auth.uid()` and the active database role.
- Public News list/detail routes read only the `news_public_articles` published projection when Supabase is configured.
- The Publisher/Administrator review queue supports approval, rejection with a reason, and a separate publication action.

## Configuration still required

1. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for local development.
2. Provide the same public build variables to the CI/deployment build. They are public identifiers; no service-role key is used.
3. Create and verify the first Supabase Auth user.
4. Insert that user's UUID into `public.admin_users` as `administrator`, `is_active = true`, using a controlled operator action. No administrator account is pre-created by this code.
5. Enable leaked-password protection in Supabase Auth before any public account-registration flow is introduced.

## Deliberate limitations

- No user self-registration, invitation or password-reset UI yet.
- No role-management screen.
- The login flow has Supabase Auth's configured rate limits; application-level throttling/CAPTCHA has not been added.
- The News editor can save a shared draft and submit it for review. The remote draft library/reopen flow is not yet implemented; its revision reference is currently kept in memory during the editing session. Other admin editors still use local browser storage and demo data.
- News revision and audit table writes remain disabled for browser clients. The authenticated public RPC wrapper delegates to a private SECURITY DEFINER implementation with explicit role checks and transactional audit writes.
- No deployment, publication or PR merge was performed.
