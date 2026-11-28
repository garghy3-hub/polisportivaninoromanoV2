# Editorial checklist (V2)

This is the operational content-quality checklist for V2. The branch contains database-backed editorial workflows for News, teams and calendar, but the live Supabase project is currently inactive and authenticated end-to-end behavior has not yet been verified. A completed checklist or successful CI run is not proof of production readiness.

## News

- [ ] Verify title, copy, category, dates, author and source.
- [ ] Check spelling of names and organizations.
- [ ] Verify photo rights, credits and alt text.
- [ ] Keep unpublished items in draft state.
- [ ] Publish only an approved revision after editorial review.
- [ ] Confirm the public article view and social share preview.

## Match schedule and results

- [ ] Verify competition, teams, venue and local date/time from an official source.
- [ ] For postponements/cancellations, preserve the status and communicate the update.
- [ ] Mark results completed only after confirmation.
- [ ] Check scores carefully before publishing.
- [ ] Confirm that only published events in published seasons appear publicly.

## Squad profiles

- [ ] Confirm roster, jersey number, position and staff role with the club.
- [ ] Confirm consent and permission for photographs where required.
- [ ] Do not publish personal contact details or other sensitive information.
- [ ] Check the public team, roster and staff projection after publication.

## Workflow verification

- [ ] Test draft save, submit, approve/reject, publish and unpublish with real role-specific accounts in a non-production environment.
- [ ] Confirm stale edits are rejected and audit entries are written atomically with each successful mutation.
- [ ] Decide and enforce the self-review policy consistently across News, teams and calendar.
- [ ] Confirm anonymous and Reader requests cannot invoke editorial mutations or read unpublished content.
- [ ] Verify public rendering on desktop and mobile after each content type is published.

## Website release boundaries

- Content and code changes stay in V2 branch/repository.
- V1 is not part of this workflow.
- Database integration and production deployment require separate approval.
- Never add credentials, access tokens, or private player information to source control.
