# Technical review — V2 scaffold

## Fixes applied during review

- Removed repeated TanStack file-route declarations from page route modules. Each route now retains a single declaration with its page metadata.
- Repaired malformed root metadata syntax and use valid Open Graph `property` attributes.
- Added validation for duplicate jersey numbers within a team and duplicate roster identifiers.
- Public data remains blank-safe: the scaffold does not manufacture fixtures, scores, rosters, contacts or news.

## Verification limits

- The GitHub Actions workflow is configured to run on pull requests to `main` and pushes to `feature/app-scaffold`.
- At the latest check, the GitHub connector returned no workflow runs and no commit status checks for the PR head. This means the build is **not verified** here.
- The PR mergeability status is currently reported as false. No merge or deployment was attempted.
- Visual browser testing and database integration have not been performed.

## Required before launch

1. Confirm GitHub Actions is enabled for the repository and inspect its run on the latest commit.
2. Fix any build/type errors identified by CI.
3. Review the site in desktop and mobile browsers.
4. Add approved club data and media.
5. Establish database, authentication and security policies only after explicit approval.
6. Review privacy, accessibility and domain/deployment settings.
