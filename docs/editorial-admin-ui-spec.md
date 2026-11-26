# Editorial Admin UI specification (implementation-ready)

## Design goals
- A dedicated editorial workspace, separate from the public site navigation.
- Accessible, responsive, predictable UI; no unrestricted styling controls.
- The UI is a client of server-authenticated services and must never be treated as an authorization boundary.
- Every public-facing data field, item order, visibility toggle, link and section configuration listed in the content inventory must have a management surface.

## Navigation / information architecture
1. Dashboard: drafts, review queue (role-dependent), recently changed content, validation warnings.
2. News: list/search/filter, create/edit, article preview, revisions, submission and review actions.
3. Teams: categories, team records, roster, staff; order and visibility controls.
4. Calendar/results: event list, filters, create/edit event, scores/status, order and visibility.
5. Club profile: history, mission, contact/social links, organizational people and partners/sponsors.
6. Pages & homepage: standard page copy/SEO, homepage section ordering/visibility and configurable image slots.
7. Navigation & footer: item labels, destinations, order and visibility.
8. Media: searchable assets with alt text, captions, metadata, usage context.
9. Site settings: site metadata, brand preset, language/locale, interface copy and controlled theme options.
10. Users & audit: administrator-only role management and immutable audit history; hidden from unauthorized roles.

## Common resource-list behavior
- Search, filters and stable sort/order.
- Explicit visibility/status and last-updated fields.
- Accessible pagination or bounded lists.
- Clear empty/loading/error states.
- New/Edit actions based on permission.
- Avoid destructive deletion by default; archive where possible and require confirmation for irreversible actions.

## Editor behavior
- Group fields by content, display, media and SEO.
- Inline validation and clear error messages.
- Save draft and submit-for-review only where allowed.
- Show unsaved-change warning.
- Preview a specific revision using public components.
- Preview cannot publish or grant access.
- Content forms expose ordered collections with accessible reorder controls.
- Media selection requires alt text (unless decorative), safe link checks and validation.
- Never accept actor identity or role as client-supplied authorization evidence.

## Review workflow
- Editor: draft editing and submission.
- Publisher: review, approve/reject with rationale, publish, unpublish/archive/restore as policy permits.
- Administrator: all editorial privileges and site/user configuration.
- Status transitions enforced by server policy and audited transactionally.
- UI hides unavailable actions but server denies direct unauthorized requests independently.

## First implementation vertical slice
Build one complete resource first (news article): list, create/edit draft, validation, server boundary, revision, review, preview and publication, audit, automated tests. The field groups, workflow, service boundary and acceptance criteria are detailed in `docs/news-admin-contract.md`. Only after the vertical slice is proven, reuse the components and services for teams, calendar, club profile and settings.

## Acceptance criteria
- Role-specific actions reflect permissions and unknown roles fail closed.
- Server independently verifies every mutation and derives actor from session.
- All forms keyboard-operable and screen-reader labels/errors are clear.
- Responsive layout at mobile/tablet/desktop.
- Draft/revision changes are persisted, with conflict detection.
- Public pages read published records only; preview is scoped and expires.
- Audit and content mutations succeed/fail atomically.
- All editable content inventory fields can be changed through UI, without developer intervention.
- No fake login, local-only publish simulation, or client-only authorization.

## Current repository status

The repository contains an admin dashboard, client-only News and Teams/Roster editing/preview workbenches, a Calendar/Results workbench, and a Media Library structural screen. News, team, calendar and result fields are temporary component state and are not persisted; the Media Library has no upload, storage, asset listing or metadata persistence. No authenticated admin API, production authentication, or editorial database is connected. The remaining management areas are specified but not yet implemented.

The admin dashboard and workbenches must not be treated as operational publishing tools. The server-side prerequisites and release gates above remain mandatory.
## Media library: upload and asset rules

The media library is a managed editorial resource, not a free-form URL field. Its first implementation must provide searchable/filterable assets, upload progress and failure recovery, preview, editable alternative text and caption, and explicit selection when attaching an asset to an article, team, player, staff member, sponsor or site setting.

The current metadata validation contract accepts JPEG, PNG, WebP and AVIF images up to 10 MiB. File names are display metadata only; storage keys must be generated server-side as safe relative object keys. The browser-provided MIME type and size are untrusted: the upload service must inspect file bytes, verify actual format, enforce size limits again, reject malformed or decompression-bomb images, and apply safe image dimensions before making an asset public. SVG is excluded from the initial allowlist.

The editor must never be able to set uploader identity, storage key, public URL or asset ownership directly. These values are assigned by the trusted server after authentication and authorization. Uploads require an Editor permission; asset deletion/replacement must check references and use a recoverable lifecycle rather than silently breaking published pages. Alt text is required for informative images; decorative use must be an explicit, accessible decision at the point of placement.

This is a validation and UI contract only. There is no upload endpoint, object storage, media browser, or persisted asset library in the current prototype.
