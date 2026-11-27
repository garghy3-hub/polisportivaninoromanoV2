# V2 media storage rollout checklist

## Current boundary
- The admin media workbench stores blobs in browser IndexedDB only.
- IndexedDB media is device/browser-local; it is not a shared editorial archive.
- Database `media_assets` rows and `nrm-media` storage policy references exist in the foundation migration, but the end-to-end shared upload flow is not yet implemented or verified.

## Implementation sequence
1. Confirm bucket `nrm-media` exists, is private/public as intended, and has a size/MIME policy consistent with the 10 MiB JPEG/PNG/WebP/AVIF validation.
2. Implement an authenticated server-mediated metadata operation with active-role checks; avoid service-role keys in browser code.
3. Upload files using the authenticated Supabase Storage client and narrowly scoped object paths; do not allow arbitrary path traversal or overwrite across users without explicit rules.
4. Insert/update `media_assets` metadata transactionally or with a compensating-delete strategy if metadata insertion fails.
5. Produce URLs only according to the bucket's visibility design; avoid exposing private object URLs as permanent public links.
6. Replace the local media library in admin UI with a shared library, while optionally retaining IndexedDB drafts as offline staging.
7. Test editor, publisher, administrator, inactive, anonymous, cross-user access, upload size/type rejection, delete, metadata mismatch, and orphan-object handling.
8. Verify media references in news/team records and prevent deleting referenced assets or implement safe retirement.

## Release gate
- Do not claim shared uploads working until authenticated tests against the configured Supabase project pass.
- Do not merge/deploy this workflow before DB/storage policy verification.
