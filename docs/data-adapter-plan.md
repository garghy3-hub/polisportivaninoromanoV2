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
## Implementation progress — local content boundary

The following first step is now present in the V2 codebase:

- `SiteSettings` and typed homepage/navigation content contracts.
- A local seed module (`src/lib/site-data.ts`) that holds editable homepage copy, feature cards, CTA labels/links and navigation labels/links/order/visibility.
- `ClubContentService.settings()` exposes those settings to the shared layout and homepage.
- The homepage feature cards are rendered from the content collection, rather than being individually hard-coded in the route.
- The shared navigation reads its entries from the settings module.

This is an architectural foundation only. It is **not** yet a visual admin panel: content is still edited in the local seed module by a developer. The next implementation stages are to move the remaining public copy (including secondary pages, footer, branding and metadata) behind the same content boundary, then build authenticated editor screens with draft/preview/publish, media management, permissions and audit history. Only after those foundations are reviewed should a persistent storage adapter be introduced.

Do not describe the site as fully editable until the protected editor can manage every public-facing field end-to-end without source-code changes.
## Implementation progress — all public page copy and SEO

The local content boundary now includes typed, seeded settings for:
- Site-wide title, description and Open Graph title/description.
- Main navigation labels, destinations, order and visibility.
- Homepage hero, calls to action, feature cards and closing sections.
- News page headings, empty state and editorial topic cards.
- Team page headings, category cards, empty states and related action.
- Calendar page headings, event-type labels and empty states.
- Society page headings, information pillars and completion notice.
- Footer copyright and project label.
- Per-page SEO title and description for news, teams, calendar and society.

The shared layout and public routes now read these values through the content service. Editorial data such as articles, teams and match events continues to use the same service boundary.

**Important limitation:** this is still local seed data, not a working editor. The settings are not yet editable through a browser-based panel, and no authentication, roles, draft workflow, media library, audit log or persistent storage has been implemented. Brand assets and some identity details in the shared header remain to be moved into settings. The acceptance criterion remains that an authorized editor can change every public-facing field without source-code changes.

Header monogram, club name, descriptor and accessible brand label are also now stored in the local site settings and rendered by the shared layout. This still does not replace the eventual managed brand-asset library or controlled visual-identity settings.
## Editorial administration contracts — groundwork

Typed contracts now describe the records the future protected panel will need:
- `EditorialRole` and `RevisionStatus` for role-aware editorial workflow states.
- `EditorialRevision<T>` to retain draft content, creator/updater metadata, review decisions and publication metadata.
- `EditorialAuditEntry` for server-authored, append-only change history.
- `MediaAsset` for storage key, file metadata, alternative text, caption and uploader metadata.
- `validateSiteSettings()` for required public copy, safe links, unique IDs and ordered/visible configurable collections.
- `validateMediaAsset()` for required metadata, positive file size, valid upload date, safe public URL and non-empty alternative text.

These are contracts and validation helpers, not an implemented security boundary. The future server must derive actor IDs and roles from a verified session, enforce permissions on every mutation, prevent clients from writing audit fields, and store revision/audit records transactionally. A browser-only role selector or hidden admin route is not authorization. Do not expose an admin editor until server-side authentication and authorization are in place.
## Further implementation progress — public interface copy and accessibility

To make the editability boundary more complete, remaining public-facing labels have been moved into typed site settings as well:
- Homepage social-proof line, visual-panel labels, volleyball artwork title/description, visual monogram/counter and brand-color captions.
- Shared skip-link text, mobile-menu labels and navigation accessible name.
- Accessible names for news, team, calendar and society content regions.
- Italian display labels for news categories, event statuses and roster counts; raw internal enum values are no longer shown to visitors.
- Settings validation now checks these required labels alongside the existing navigation, homepage, SEO and section configuration.

The public routes and shared layout read these labels through the content service. This remains a code-managed seed, not a browser editor. A complete audit of every visible fallback and any future media captions is still required before the full editability acceptance criterion can be claimed.
Homepage and interface-copy audit continued:
- Remaining homepage artwork captions, social-proof line, visual-panel labels, monogram and color captions are now settings-backed.
- Shared skip-to-content text, mobile-menu labels and accessible navigation name are settings-backed.
- Page-region accessible names are settings-backed.
- News category and event-status internal values are rendered through editable Italian label maps; roster count label is configurable.
- The settings validator checks these labels before a future save/publish operation.