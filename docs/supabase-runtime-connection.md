# Supabase runtime connection checklist

This document is the handoff from the installed database foundation to the V2 application integration. It does not contain credentials.

## Worker configuration

Configure these Cloudflare Worker runtime variables for the V2 environment:

- `SUPABASE_URL`: the project's Supabase URL.
- `SUPABASE_PUBLISHABLE_KEY`: the project's publishable API key.

Both are public connection identifiers. Do not configure or expose a Supabase secret/service-role key in browser code. Prefer the publishable key and rely on Auth JWTs plus RLS for user-scoped access.

For TanStack Start on Cloudflare Workers, read runtime bindings from the request/runtime context. Do not capture Worker environment values at module initialization.

## Authentication adapter

Use the Supabase SSR package for cookie-based sessions in TanStack Start. The server client must be created per request, read incoming cookies and append refreshed cookies to the response. Apply secure, HttpOnly, SameSite and path settings; never serialize a session token into page data.

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
