# V2 content architecture

This document describes the planned separation between editorial content, UI, and persistence.

## Separation principles
- **Routes and UI:** render content and handle presentation; they should not own database queries.
- **Content contracts:** `src/lib/content-types.ts` defines shared TypeScript contracts.
- **Repository/data adapters:** future layer to load and save content, independently of the UI.
- **Persistence:** Supabase may be introduced in a later, separately authorized step. This scaffold does not connect to a database.
- **V1:** this V2 repository and branch remain separate from the V1 repository.

## Content families
- Articles/news: slug, title, excerpt, body, category, publication status, timestamps, media and tags.
- Teams: team name, category, season, roster and staff.
- Matches/events: date, participating teams, venue, competition, status and score (when verified).
- Club profile: informational sections and contact/social details.

## Editorial workflow
1. Create content as draft.
2. Review names, dates, scores, images and attribution.
3. Publish only verified material.
4. Archive rather than silently delete content when editorial history needs preserving.

## Data handling
- Empty content is a valid state; the public site must not invent articles, rosters, scores or fixtures.
- Dates are stored as ISO 8601 strings; match times should be interpreted in the venue's local timezone.
- Keep stable IDs separate from display names and slugs.
- Media URLs and image attribution should be stored explicitly.
- The adapter layer should filter published content for public views and keep administrative operations separate.

## Future database mapping
A later Supabase design can map these contracts to independent tables (articles, teams, players, staff, match events and club profile/contact records), with suitable constraints, indexes, policies and storage rules. No schema or access policies are deployed by this document.
