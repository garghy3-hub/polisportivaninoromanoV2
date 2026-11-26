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
