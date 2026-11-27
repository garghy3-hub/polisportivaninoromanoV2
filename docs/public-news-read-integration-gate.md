# Public News read integration gate

Status: **not integrated**. This document records the safe next step after introducing the provider-neutral News read service.

## Verified current state

- `/news` reads `localContentService.news()` and `localContentService.settings()`.
- `/news/$slug` resolves its article through `localContentService.articleBySlug()`.
- `localContentService` is backed by repository-local `content-data`, `club-data` and `site-data`; it is a local/demo source, not a production CMS.
- `createNewsReadService` is a server-only read facade that accepts a repository dependency. No production repository adapter, authentication/session integration, or server request boundary is implemented.
- TanStack route loaders are part of the application route layer. They must not import a server-only repository/service implementation into browser-reachable route code.

## Decision

Do not wire `createNewsReadService` directly into either route and do not silently replace local demo content with an empty result. The public route integration is blocked until a trusted server-only composition boundary and a real read repository are available.

## Required implementation sequence

1. Implement a server-only composition module that constructs the read service from an explicitly configured repository adapter. It must fail closed when no adapter is configured; it must not fall back to local demo articles in production.
2. Expose a narrow TanStack Start server function for public reads. The browser may request only a slug or bounded list query; it must never supply actor IDs, roles, publication state, revision IDs, or repository configuration.
3. Keep the public server function limited to `getPublishedBySlug` and a bounded published-list operation. Do not expose editorial queues, revisions, audit data, or draft previews to anonymous callers.
4. Map the validated public DTO to a dedicated public view model. Preserve the article's approved content, publication timestamp, SEO fields and accessible image alternative text. Never expose revision metadata, creator/updater IDs, review notes, or audit details.
5. Update `/news` and `/news/$slug` loaders to call only the server function. Keep settings copy behind the existing content/settings boundary until settings have their own trusted provider.
6. Add tests for unpublished/archived exclusion, invalid adapter payloads, slug mismatch, missing adapter, server/client import separation, bounded pagination, and SEO/alt-text mapping.
7. Remove or explicitly label local demo articles before any public deployment. Do not represent seed data as official club news.

## Acceptance criteria

- Anonymous visitors can read published articles only.
- Draft, in-review, approved-but-unpublished, rejected and archived revisions are never returned.
- No privileged service, repository, credential, or internal revision metadata enters the client bundle or response.
- Missing provider configuration produces a safe unavailable/empty state, never a demo-data fallback that looks official.
- Editors can continue to manage copy and publication only through the separately authorized editorial workflow.
- CI passes after route-level tests and production build.

## Scope and authorization

This is an implementation gate, not permission to choose or connect a database/provider, configure credentials, deploy, or publish content. No production data is included here.
