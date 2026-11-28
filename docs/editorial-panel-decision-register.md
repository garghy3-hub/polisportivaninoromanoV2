# Editorial panel pre-implementation decision register

This register lists decisions that block a safe operational editor. It is intentionally provider-neutral and does not authorize connecting any external service.

| Decision | Required outcome | Blocking risk if unresolved |
|---|---|---|
| Authentication | Approved sign-in, session, recovery and revocation model | Unauthorized access and account recovery abuse |
| Roles | Role assignment, invitations, separation of duties and last-admin protection | Privilege escalation or lockout |
| Persistence | Transactional revision/publication/audit storage; constraints and concurrency | Partial writes, lost updates and audit gaps |
| Media storage | Access policy, upload validation, scanning, retention and deletion | Malicious files or private media exposure |
| Preview | Secure, revision-scoped, expiring preview access | Draft leakage or indexing |
| Public reads | Published-only projection and caching/invalidation policy | Draft content leaking or stale content |
| Audit | Append-only events, retention, access, export and redaction policy | Untraceable editorial changes or excess personal data |
| Backups | Schedule, encryption, retention and tested restore process | Irrecoverable content loss |
| Testing | Test runner, unit/integration/e2e, security and accessibility gates | Untested critical workflow |
| Operations | Monitoring, rate limits, incident response, maintenance and ownership | Undetected failures or abuse |
| Deployment | Staging/prod boundaries, secret storage, rollout and rollback | Accidental production exposure |

## Decision protocol

- Document options, costs, risks and the club's operational needs.
- Obtain explicit approval before provisioning or connecting providers.
- Never store credentials in the repository or client bundles.
- Use test data and isolated staging before production.
- Verify backup restoration and access revocation before release.

## Current state

These decisions remain open. No services are provisioned, connected or configured by this register.
