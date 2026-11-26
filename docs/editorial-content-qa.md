# Editorial content QA checklist

Use this checklist before importing or publishing content on V2. The current content layer is typed and validation helpers are available, but this is not yet a connected editorial CMS.

## News
- [ ] Unique ID and slug across the article collection
- [ ] Title and body are not blank
- [ ] Category and status use supported values
- [ ] Creation and update dates parse correctly
- [ ] If published, a valid publication date is present
- [ ] Confirm factual details, spelling, names, quotes and image rights

## Teams
- [ ] Unique team ID and slug
- [ ] Name and category are valid
- [ ] Player/staff IDs are present and unique within each group
- [ ] Player names and staff names/roles are present
- [ ] Jersey numbers are non-negative integers and unique within the team
- [ ] Verify roster, season and staff details against an authoritative club source

## Match calendar and results
- [ ] Unique event ID
- [ ] Date/time parses correctly and timezone assumptions are checked
- [ ] Home/away names are present and distinct
- [ ] Status is valid
- [ ] Completed match score is recorded as non-negative integers
- [ ] Verify venue, competition, fixture/result and score before publication

## Release safety
- [ ] Run collection validators on the content batch
- [ ] Review validation errors; do not bypass unresolved errors
- [ ] Verify pages display safe empty states when data is missing
- [ ] Build/type-check on the current branch before requesting approval

Validation catches structural errors; it does not verify that sports facts are true.
