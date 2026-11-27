# Supabase runtime connection checklist

This document is the handoff from the installed database foundation to the V2 application integration. It does not contain credentials.

## Worker configuration

The current V2 client reads two public Vite variables at build time:

- `VITE_SUPABASE_URL`: the project's Supabase URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the project's publishable API key.

Copy `.env.example` to `.env.local` for local development and provide the same values to the V2 build environment in CI/deployment. Both values are public connection identifiers. Do not add a Supabase secret/service-role key to Vite variables, browser code or Worker configuration. The application uses Auth JWTs plus RLS for user-scoped access.

## Authentication adapter

The initial adapter is implemented in `src/lib/supabase/server.ts` and `src/lib/server/editorial-auth.ts`. It uses `@supabase/ssr` with request-scoped cookie storage, PKCE and Supabase `getClaims()` to verify the access token. The active role is loaded from `public.admin_users`; user-editable metadata is never used for authorization. The login page is `/admin/login`, and the `/admin` route family is guarded server-side. No sign-up flow is exposed.

Every server function that reads private data or performs a mutation must independently authenticate the caller and load their active `admin_users` row. Route guards are only a UI convenience and are not an authorization boundary.

## First Administrator bootstrap

No administrator is assigned by the schema migration. After creating and verifying the first Auth user:

1. Obtain that Auth user's UUID from the trusted Supabase Auth administration interface.
2. Insert that UUID into `public.admin_users` with role `administrator` and `is_active = true` using a controlled operator action.
3. Verify that the user can read their own allow-list record and that non-admin accounts cannot access editorial records.
4. Record the bootstrap operation in the audit log.

Do not use user-editable Auth metadata to assign roles. Do not expose a self-service role assignment route.

## Required Auth hardening

Enable leaked-password protection in Supabase Auth before public account registration. The project security advisor currently reports this setting as disabled.

## Server-side implementation gates

- Create the Supabase SSR server client per request.
- Implement sign-in, sign-out, session refresh and account recovery with rate limits.
- Add CSRF/same-origin protection to all mutation endpoints.
- Derive actor identity and role from the verified session and `admin_users`; ignore client-supplied actor IDs or roles.
- Implement news workflow operations as atomic server-side transactions, including optimistic version checks, separation of duties and audit append.
- Keep news revision table writes unavailable to browser roles until these commands are complete.
- Verify uploads by file signature, enforce size/MIME/dimension limits, and use server-generated object keys. The existing `nrm-media` bucket is public, so stored objects must be treated as publicly readable.
