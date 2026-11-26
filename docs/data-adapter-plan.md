# Data adapter and editorial management roadmap

This document describes a future integration boundary; it is not an implementation of a database or admin system.

## Public content currently supported

- News articles (published status only)
- Teams and rosters
- Events, upcoming schedule and results
- Club profile

These data contracts are defined in `src/lib/content-types.ts` and surfaced by `src/lib/content-service.ts`.

## Future integration principles

1. Preserve the `ClubContentService` interface and use a replaceable implementation.
2. Keep privileged database credentials and secrets server-only; never embed them in client bundles.
3. Enforce access controls at the data layer, not solely through UI hiding.
4. Require authentication and role-based authorization for editorial mutations.
5. Keep draft and archived articles out of public queries.
6. Validate all imported and submitted records using the existing validation layer.
7. Do not invent club data or expose personal details without authorization.
8. Add auditability for changes and a recovery/backup plan before editorial use.
9. Verify privacy policy, consent, data retention and relevant legal requirements before launch.

## Editorial roles (proposal, pending owner approval)

- **Reader:** public content only.
- **Editor:** prepare and edit content; no publishing rights by default.
- **Publisher:** review and publish approved content.
- **Administrator:** manage configuration and access, with limited and audited privileges.

Roles are a proposal only. No account system or database policies are configured.

## Mandatory requirement: all public-facing content must be editable

The public website must not depend on developers for ordinary editorial updates. Every item that appears to visitors must be manageable through a protected administration panel (or an equivalent editor interface), including:

- Page titles, headings, paragraphs, labels, captions and announcements.
- News articles, categories, publication dates, featured status and images.
- Teams, categories, rosters, staff profiles and biographies.
- Fixtures, events, venues, match status, scores and related notes.
- Club profile, history, contacts, sponsors and partner information.
- Navigation entries, calls to action, links and their order/visibility.
- Homepage sections and cards: content, images, order, visibility and destination links.
- Image and document assets, with alternative text and captions.
- Public-facing page metadata such as SEO titles, descriptions and social preview images.

### Editorial and visual control

- Editors must be able to create, edit, save drafts, preview and submit changes without touching source code.
- Publishing and unpublishing must be explicit actions, with role-based permissions and a record of who changed what and when.
- The panel must support safe media upload/selection and content validation before publication.
- Homepage blocks and navigation should be configurable (reorder, show/hide, edit text and links).
- Visual identity should use centrally managed design settings or approved presets for brand colors, logos and key visual assets; avoid arbitrary styling controls that could break accessibility or brand consistency.
- Essential interface/system messages should be centrally configurable or consistently localized, not scattered as hard-coded page copy.
- Public pages must render from the content service; components should provide layout and behavior, not own changeable editorial copy.
- Empty states and fallback labels must remain useful and must never fabricate club or sporting information.

### Acceptance criterion

A club editor with the appropriate permissions must be able to update any public-facing text, image, link, sport record or configurable homepage/navigation element from the administration interface, then preview and publish it, without a code change or developer intervention. Any intentional exception must be documented and approved before launch.

This is a product requirement, not an implemented feature. The current V2 still uses local content scaffolding; no administration panel, authentication or database has been connected.
