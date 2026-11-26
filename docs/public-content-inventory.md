# Public content inventory and management coverage

This inventory is based on the V2 route and content contracts. It is the field-level checklist for the protected editorial panel. The current local adapter is not a browser-editable CMS.

## Public routes and shared shell

| Surface | Current source | Fields that must be editable |
| --- | --- | --- |
| Shared header | SiteSettings.brand, SiteSettings.navigation, SiteSettings.interface | Logo/monogram, alternative text, club name, descriptor, accessible labels, menu entries, destinations, order and visibility |
| Shared footer | SiteSettings.footer | Copyright line, project label, future footer links and social/contact links |
| Homepage | SiteSettings.home | Every eyebrow, heading, accent, paragraph, visual label, image and alt text, social-proof line, feature-card field, CTA label/destination, order and visibility |
| News index | SiteSettings.news + NewsArticle[] | Page copy, SEO, empty state, topics/categories and their order/visibility; article title, slug, category, excerpt, body, cover, alt text, tags, author, publication date/status and social metadata |
| Teams index | SiteSettings.teams + Team[] | Page copy, SEO, category headings/eyebrows/empty states, order/visibility, CTA; team identity, category, season, description, logo/alt, roster and staff |
| Calendar | SiteSettings.calendar + MatchEvent[] | Page copy, SEO, event types/status labels, empty states; event date/time, season, teams, venue, competition, status, scores, outcome and notes |
| Society | SiteSettings.society + ClubProfile | Page copy, SEO, pillars/order/visibility, history, mission, identity, organization, contacts, social links, sponsors and partners |
| SEO/social | SiteSettings.site + per-page SEO + article metadata | Browser title, description, canonical URL, Open Graph title/description/image/alt, Twitter title/description/card, page-specific social image |

## Entity-level field coverage

### News article
- Identity: ID, slug, title, category.
- Editorial: excerpt, body, tags, author.
- Publication: draft/published/archived status, created/updated/published timestamps.
- Media: cover image URL and alternative text.
- Search/social: SEO title/description and social image URL/alternative text.

### Team, roster and staff
- Team: ID, name, slug, category, season, description, logo URL and alternative text.
- Player: ID, name, jersey number, role, biography, portrait URL and alternative text.
- Staff: ID, name, role, biography, portrait URL and alternative text.
- Collections: ordering and visibility should be managed where the public layout presents a configurable list.

### Calendar event/result
- ID, season, date/time, home/away names, venue, competition, status, scores, outcome and editorial notes.
- Validation must reject invalid dates, same home/away team, invalid status and incomplete/negative final scores.

### Club profile and organization
- Identity: name, short name, description, history, mission and address.
- Contacts: label, value and optional safe destination (HTTPS, mailto, tel or same-site path).
- Social channels: label, displayed value and HTTPS destination.
- People/organization: stable ID, name, role, biography, portrait/alt text, order and visibility.
- Sponsors/partners: stable ID, name, relationship type, description, logo/alt text, HTTPS website, order and visibility.

### Managed media
- Stable asset ID and storage key, original filename, MIME type and size.
- Public URL where applicable, descriptive alt text, caption, upload timestamp and uploader identity.
- Binary storage and media metadata remain separate; no storage vendor is selected.

## Known implementation gaps

1. The society route now conditionally renders ClubProfile description, history, mission, address, contacts, social links, visible organization people and visible sponsors/partners. Labels are stored in SiteSettings.society and validated. No blank profile section is rendered.
2. ClubProfile is still seeded only with the verified club name. No addresses, contacts, biographies, sponsor names or partner data should be added until supplied and checked.
3. The news index links to a dedicated /news/$slug detail route. The route resolves published articles only, renders body as plain text (never raw HTML), supports cover-image alt text and article-level SEO/social metadata, and uses editable not-found and publication labels.
4. Site-wide Open Graph/Twitter metadata now comes from SiteSettings.site. Page-level SEO/social metadata and optional canonical links are rendered through a shared helper; article details use article-specific SEO/social fields. Canonical and social-image values are validated before publication.
5. The team contracts support roster and staff records, but the public route should be audited against all desired player/staff fields before the admin forms are finalized.
6. No protected admin, authentication, server mutation API, persistent content store, upload workflow, revision history or audit log is implemented.

## Acceptance checks for future admin implementation

- Every editable field above has a typed form control, server-side validation and a preview using the public rendering components.
- Collections support create/edit, reorder and visibility controls where specified.
- Media selection always includes alt text and does not permit unsafe public URLs.
- Preview is revision-scoped, short-lived and server-authorized.
- Only server-derived roles can save, review, approve or publish; audit entries are server-authored and append-only.
- Anonymous public reads return published content only.
- An authorized editor can complete an ordinary content change without changing source code or contacting a developer.


## Implementation progress — society profile rendering

The public society page now reads the ClubProfile through ClubContentService and conditionally renders its optional description, history, mission, address, contacts, social links, organization people, sponsors and partners. People and partner collections respect visibility and order. The section labels are editable SiteSettings fields and are covered by settings validation. Profile validation is exposed by the local content service.

The local ClubProfile still contains only the verified club name, so no additional profile sections appear until official information is supplied. This work does not add an admin panel or persistent editing; the seed remains developer-managed.


## Implementation progress — public news detail pages

Published news cards now link to a slug-based detail route. The content service resolves slugs only from the published-news collection, so drafts and archived articles are not exposed. The detail page renders article body as plain text with preserved line breaks, displays optional cover imagery and publication date, and derives page/Open Graph metadata from article fields with settings-based fallbacks. The back link, publication label and not-found copy are editable in SiteSettings.news.

The route file is discovered by the TanStack file-route plugin; generated route types and the build still need CI confirmation. Article bodies are deliberately not interpreted as HTML.


## Implementation progress — SEO and social metadata

The shared document head now renders editable site title/description, Open Graph title/description/image/alt text and Twitter title/description/card settings. Secondary pages use a shared page-head helper for their SEO title/description, Open Graph and Twitter metadata, optional social preview image and optional canonical URL. The homepage supports the site canonical URL, and article detail pages use article-specific SEO/social metadata with settings-based fallbacks.

Canonical URLs are not synthesized: they are emitted only when an editor supplies a validated HTTPS URL. The application still has no browser-based settings editor.
