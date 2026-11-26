# News admin — implementation contract

This is the implementation contract for the first editorial vertical slice. It is not a running admin or substitute for server authentication/persistence.

## Scope of the first resource

The News resource will manage the existing `NewsArticle` public contract and related revision workflow. The first release is intentionally limited to news so that authorization, persistence, preview, publication and audit can be proven end-to-end before expanding the panel.

## Field groups and form mapping

| Group | Fields | UI behavior |
| --- | --- | --- |
| Editorial | title, slug, category, excerpt, body, author, tags | Required fields clearly marked; slug normalization and uniqueness verified server-side; body preserves line breaks |
| Publication | status, publishedAt | Status is server/workflow controlled; date only set by authorized publication action |
| Cover | cover image asset, coverImageAlt | AssetPicker; alt text required unless marked decorative; metadata validated |
| SEO | seoTitle, seoDescription | Character guidance and preview; optional fields fall back to editorial title/excerpt where policy allows |
| Social | socialImageUrl, socialImageAlt | Safe URL/media selection and alternative text; preview |
| Revision | revision ID, base revision, created/updated metadata | Server generated; conflict detection; no client-supplied actor identity |

## Resource list

- Search by title and slug.
- Filter by workflow status and category.
- Display title, category, workflow state, updated time and author attribution from server data.
- Sort and paginate server-side once persisted.
- Create draft and open draft controls only when session-derived permission allows.
- Empty, loading, error and access-denied states.
- Avoid irreversible delete; archive instead.

## Editor requirements

- Sections: Editorial, Cover/media, SEO/social, workflow information.
- Validate on client for convenience and independently on server for security.
- Accessible labels, required indicators, field error associations and validation summary.
- Dirty-state warning and preserve submitted values after server failure.
- Save and submit controls reflect verified permissions; all mutations server-enforced.
- Preview the exact revision with shared public components, scoped and short-lived.
- Show a revision diff before review.
- No role chooser, fake authentication, local-only save/publish behavior or browser-storage persistence.

## Workflow states and actions

Use the explicit policy already defined in `src/lib/editorial-permissions.ts`; the UI must not invent transitions.

- Editor: draft editing and submission for review.
- Publisher: review/reject/approve and publish approved content, as allowed by server policy.
- Administrator: configuration and access administration (not required for this first News slice beyond verified session/permissions).

Each mutation revalidates the session, derives actor from session, checks permission and transition, validates input and writes revision plus audit event transactionally. Audit failure must roll back the mutation. Publication timestamps and publication status are server-controlled.

## API/service boundary

A provider-neutral server service boundary now exists at `src/lib/server/news-editorial-service.ts` for these operations:

- create draft
- update draft with an expected revision version
- submit for review with an expected revision version
- approve or reject a submitted revision (a rejection requires a reason)
- publish an approved revision with a version precondition

The service checks the session-derived actor's permissions, validates required News fields and configured categories, checks explicit workflow transitions and delegates to a repository port. The repository contract requires server-generated identity/timestamps, atomic revision plus audit writes, slug uniqueness, editability/ownership checks, optimistic concurrency, reviewer metadata and atomic publication projection updates. Unit tests cover denied editor actions, publisher review/publication permissions, rejection rationale, invalid content and version preconditions.

This is not yet a running API or persistence adapter. No route calls the service, no repository implementation exists, and the session actor must be created only after a trusted server-side authentication adapter verifies the credential and loads the session. The helper does not verify cookies or credentials itself.

Still planned: list revisions, approve/reject with rationale, publish approved revisions, archive/unpublish, and authorized short-lived preview. Do not expose mutations through client code until authentication, session verification, persistence and server-side authorization exist. Keep public routes restricted to published data.

## Test acceptance

- Field validation and safe media/link checks.
- Slug uniqueness and duplicate/concurrent update handling.
- Role/transition matrix, including unknown roles and direct unauthorized requests.
- Actor/role spoofing attempts are ignored; server session is authoritative.
- Revision and audit writes are atomic.
- Draft/rejected/archived records cannot appear in anonymous public listing or detail.
- Preview token expires, is revision-scoped and denied to anonymous unauthorized users.
- Form keyboard/screen-reader usability and responsive layout.
- End-to-end test of create -> edit -> submit -> review -> preview -> publish -> public rendering.

## Implementation prerequisites

Before enabling this module, separately approve and implement authentication/session design, server service boundary, persistence/revision transaction, secure media handling and automated test infrastructure. No provider, database or deployment decision is made in this contract.
