# V2 release readiness

This checklist tracks what must be verified before the V2 site can be released. It is not approval to deploy.

## Application and code
- [ ] Run a clean dependency install and production build
- [ ] Confirm TypeScript checks pass
- [ ] Review generated route tree and route navigation
- [ ] Verify desktop, tablet and mobile layout in an actual browser
- [ ] Test mobile navigation, keyboard focus and escape/close behavior
- [ ] Check contrast, heading hierarchy, accessible names and live empty states
- [ ] Review console errors and failed network requests

## Content
- [ ] Verify club profile and contact details from an authoritative source
- [ ] Confirm roster names, jersey numbers, staff, team categories and season
- [ ] Confirm fixture/results, venues, competition and time zone
- [ ] Confirm editorial content, images, rights and alt text
- [ ] Run content collection validation

## Security and operations
- [ ] Choose and authorize hosting/deployment destination
- [ ] Configure production secrets only in the hosting platform
- [ ] Review data access model and permissions before any database connection
- [ ] Confirm backups and rollback approach
- [ ] Review privacy policy, cookie policy and any forms/data collection
- [ ] Confirm analytics and consent requirements before adding tracking

## Release authorization
- [ ] Review the pull request and approve changes
- [ ] Resolve mergeability and CI checks
- [ ] Explicit authorization to merge
- [ ] Explicit authorization to deploy
- [ ] Verify production after release and document rollback

The V2 branch remains a proposal until review and authorization are completed.
