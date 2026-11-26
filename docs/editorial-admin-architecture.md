# Editorial administration — implementation blueprint

This document defines the next implementation stage for the V2 editorial panel. It is an architecture and acceptance specification, not a working admin interface, authentication system, API or persistence layer.

## Product boundary

The administration panel must let an authorized club operator manage every public-facing field without editing source code. It must not be exposed as a usable editor until authentication and server-side authorization exist.

The current V2 remains a local-content prototype. The public website reads local seed data through `ClubContentService`; no browser editor, authenticated session, API mutation or database is implemented.

## Admin areas and managed resources

| Admin area | Managed records and fields |
| --- | --- |
| Overview | Drafts awaiting review, scheduled/published items, validation warnings and recent audit activity |
| News | Title, slug, category, excerpt, body, cover asset, alt text, tags, author, publication status/date and SEO/social metadata |
| Teams | Team identity, category, season, description, logo, roster, player numbers/roles/photos and staff profiles |
| Calendar and results | Date/time, season, home/away teams, venue, competition, status, scores, outcome and notes |
| Club profile | Name, description/history, address, contact methods, social links, sponsors and partners |
| Pages and homepage | Every heading, paragraph, label, CTA, destination, card, section, order and visibility setting |
| Navigation and footer | Labels, internal/external destinations, order, visibility and footer copy |
| Brand and media | Approved theme preset, logo, homepage visual, asset metadata, alt text and captions |
| SEO and social | Page title/description, canonical/social preview fields and Open Graph metadata |
| Access and audit | User invitations/roles, permission assignments, revision history and append-only audit events |

The table is the minimum inventory, not permission to omit other visible copy. Before release, perform a rendered-page audit at desktop and mobile widths and add every remaining visitor-visible string, link, image and configurable block to the relevant managed resource.

## Editorial experience

1. An authenticated editor creates or opens a draft.
2. The editor changes fields using typed forms and the managed media library.
3. The server validates the complete record and reports field-level errors.
4. The editor saves a draft and can preview the exact public rendering without publishing it.
5. The editor submits the revision for review.
6. A publisher reviews the diff and preview, then approves or rejects with an optional note.
7. Only an authorized publisher can publish an approved revision.
8. Unpublish, archive and restore are explicit transitions and are audited.
9. Public content queries return published records only; drafts and archived records never leak into public routes.

Preview must render the candidate revision through the same page components as the public site, while keeping it inaccessible to anonymous visitors. A preview URL/token must be short-lived, scoped to one revision and checked server-side.

## Permission and server invariants

- Derive the actor ID and role from a verified server-side session on every request. Never accept role, actor ID, ownership or publication metadata as trusted browser input.
- Enforce authorization in every server action/API handler and at the persistence boundary; hiding controls in the UI is not security.
- Apply the fail-closed policy in `src/lib/editorial-permissions.ts`, with server-side tests for every role and transition.
- Prevent self-escalation, protect the last active administrator, validate record ownership and scope, and rate-limit authentication and sensitive operations.
- Validate and normalize all input on the server. Validate links, uploaded file type/size, image metadata and alt text.
- Write the revision change and corresponding audit event atomically. Audit entries are server-authored and append-only.
- Keep secrets and privileged credentials server-only. Never ship service-role credentials or signing keys to the browser.
- Use CSRF protections appropriate to the chosen session model, secure cookies, session expiry/revocation and appropriate security headers.
- Record who did what, to which record/revision, when, and the outcome. Avoid logging passwords, tokens or unnecessary personal data.
- Define backup, restore, retention, privacy and incident-response procedures before editorial launch.

## Proposed application boundaries

Keep page components independent from storage:

- Public reads continue through `ClubContentService` (or a server-backed implementation of that interface).
- Authenticated reads and mutations use server-only editorial services.
- Validation and permission policy remain reusable pure modules, but the server is the enforcement point.
- Revision history and audit history are separate concepts: revisions hold editable snapshots; audit entries record immutable actions.
- Media binary storage is separate from media metadata. Public URLs must be safe and stable; private originals must not become public by accident.

Do not choose or connect a database, authentication provider or object-storage vendor as part of this blueprint. That integration requires a separate, explicit decision and review.

## Delivery sequence

### Stage A — content inventory and reusable form contracts
- Audit every public route, shared layout, responsive variant, empty state and fallback.
- Map each visitor-visible field to a typed content/settings field.
- Define field-level validation and reusable form/preview components.
- Keep local seed content as the only adapter; no fake save/publish controls.

### Stage B — authentication and server authorization
- Select and approve an authentication approach.
- Implement verified sessions, role loading and server-side permission checks.
- Add automated tests for permission matrix, transition matrix, last-admin protection and unauthorized requests.
- Do not expose mutation screens until this stage passes review.

### Stage C — drafts, preview and revision history
- Implement server-backed draft create/update, submission, review and preview.
- Add transactional revision and audit writes.
- Verify that anonymous/public queries cannot retrieve drafts or archived records.

### Stage D — media, settings and publishing
- Add managed upload/selection, metadata, accessibility checks and approved brand presets.
- Implement complete settings, navigation, homepage and page-content forms.
- Enable explicit publish/unpublish/archive/restore operations with audit history.

### Stage E — release verification
- Test all managed fields end-to-end: edit, save, preview, review, publish and public rendering.
- Test desktop/mobile layouts, keyboard operation, screen-reader labels, link safety and media alternatives.
- Verify rollback/restore and backup procedures.
- Obtain owner approval before any production deployment.

## Release acceptance

The panel is not complete until an appropriately authorized editor can change every public-facing text, image, link, sport record and configurable block, save a draft, preview it, submit it for review and publish through the authorized workflow without a code change or developer intervention.

A read-only inventory page, local form state, browser storage, hidden route or UI-only role selector does not satisfy this requirement.


## Stage A — concrete form and component contracts

The initial admin implementation should be decomposed into reusable, storage-agnostic components once server authorization is in place:

- `AdminShell`: responsive navigation, page title, breadcrumbs and session-derived identity; no role selection widget.
- `ResourceList`: searchable/filterable list, status, ordering and visibility; pagination for larger collections.
- `ResourceEditor`: typed form composition, dirty-state indication, validation summary and save-state feedback.
- `FieldHelp` / `FieldError`: consistent hints, required indicators and inline errors linked to inputs.
- `AssetPicker`: managed library selection, preview, alt text and caption; uploads handled by server validation.
- `RevisionPreview`: exact draft rendering using the public components, scoped and server-checked.
- `RevisionDiff`: before/after comparison with changed fields clearly identified.
- `ReviewActions`: submit, approve, reject and publish actions visible only when the server-derived permission permits; server still rechecks every action.

### Form behavior acceptance

- Every form field is keyboard operable, labelled and has errors associated programmatically.
- Lists support explicit ordering controls and visibility toggles; order and visibility are saved as data.
- Destructive operations require confirmation and are never represented by an ambiguous icon alone.
- Saving reports success/failure, prevents duplicate submission and preserves entered values on failure.
- Unsaved changes are detected and navigation-away warnings are provided where supported.
- Content previews show image alt text context, responsive layout and metadata; validation cannot be bypassed by preview.
- Empty states, help text, labels, warnings and confirmation messages are themselves managed localization/interface content where applicable.

### Stage A exit gate

Before implementation of any editing screen, confirm the content inventory against all public routes and document the typed form contracts. No local-only save/publish simulation, fake authentication, or browser storage persistence is acceptable as a substitute for secure server behavior.


## Authorization test matrix (required before exposing admin mutations)

| Scenario | Expected result |
| --- | --- |
| Reader attempts content create/edit/submit | Denied |
| Editor attempts review, approve, reject or publish | Denied |
| Publisher attempts role assignment or settings administration | Denied |
| Administrator manages roles/settings | Allowed only after server session verification |
| Unknown role or permission value | Denied (fail closed) |
| Draft -> in-review by Editor | Allowed |
| Draft -> published directly | Denied |
| In-review -> approved/rejected by Publisher | Allowed |
| Rejected -> draft by Editor | Allowed |
| Approved -> published by Publisher | Allowed |
| Published -> draft/archive by Publisher | Allowed |
| Archived -> draft by Publisher | Allowed |
| Same-state transition or unlisted transition | Denied |
| Client-supplied actor/role differs from session | Ignore client value; derive from session |
| Audit write fails during mutation | Mutation transaction rolls back |
| Last active admin removal/demotion | Denied unless safe replacement is confirmed in the same transaction |

These are target test cases. The pure permission module alone does not enforce them in production; integration tests must exercise the authenticated server boundary and persistence transaction.
