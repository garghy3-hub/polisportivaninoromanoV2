# News revision data contract

The news editor's data model and mutation semantics are provider-neutral. This contract does not create database tables or select a persistence provider.

## Record separation

- **Article identity**: stable ID and creation timestamp; never supplied or altered by client mutations.
- **Revision**: revision ID, article ID, complete candidate content snapshot, revision number, state, created timestamp, creator identity, optional review metadata, optional publication metadata.
- **Publication projection**: public article fields derived only from the currently published revision; publication and unpublication are explicit server-side transitions.
- **Audit event**: append-only record with actor, action, resource/revision IDs, timestamp, outcome and minimal contextual metadata. No credentials or sensitive payloads.

## Candidate fields

| Field | Validation and behavior |
|---|---|
| Title | Required; trimmed; reasonable maximum length; reject blank |
| Slug | Required; normalized; unique; race-safe persistence constraint |
| Category | Required; selected from configured category list |
| Excerpt | Required; trimmed; bounded length |
| Body | Required; bounded size; line breaks preserved; rendering escapes/sanitizes |
| Author | Editable only according to configured policy; never used as actor identity |
| Tags | Optional; normalized; bounded count and length; duplicate tags removed |
| Cover image | Reference to verified media asset, not arbitrary client URL |
| Cover alt | Required for informative image; decorative status explicit |
| SEO title/description | Optional; bounded; safe text |
| Social image | Verified media asset with alt/decorative status |
| Visibility | Publication workflow controls; not an independent editable checkbox |
| Publish date | Server-generated on publish; not trusted from payload |

## Revision behavior

- New article creates a draft revision and stable article identity.
- Editing creates or updates an eligible draft revision; submitted revisions remain immutable.
- Submission to review records server-side identity/time and locks that revision from editor mutation.
- Reviewer decision records identity/time and reason when rejected; the revision creator cannot review their own submission (separation of duties).
- Changes after approval invalidate approval and require review again.
- Publish uses an approved revision only and updates public projection atomically.
- Unpublish/archive follow explicit permission and transition policy.
- Every mutation carries a revision/version precondition; conflict returns actionable response and preserves client draft.

## Form feedback contract

- Errors identify field and explain corrective action; summaries link to fields.
- Validation runs client-side for convenience and server-side as authoritative.
- Failed saves never discard entered values.
- Saving state prevents duplicate submissions but server remains idempotent.
- Preview uses the exact candidate revision and displays a clear unpublished indicator.
- Destructive actions require confirmation; cancellation is harmless.
- Empty states explain next action; no sample articles or invented club facts are inserted.

## Acceptance tests

1. Editor creates, edits and submits a valid revision.
2. Required-field and length errors render accessibly; values survive failures.
3. Editor cannot approve or publish; Publisher cannot bypass workflow; Admin permission is server enforced.
4. Approval becomes invalid when the candidate content changes.
5. Publishing requires approved revision and succeeds atomically with audit.
6. Duplicate slug conflict, concurrent revision conflict and retry are handled.
7. Public read never exposes draft or review content.
8. Preview requires scoped authorization and expires.
9. Image/media validation and alt text rules are enforced.
10. Audit records cannot be changed through editorial API.

This contract is planning only; implementation remains blocked until secure authentication, persistence and server mutation boundaries are in place.
