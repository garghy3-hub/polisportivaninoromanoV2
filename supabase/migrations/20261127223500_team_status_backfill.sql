-- Preserve existing public team visibility when introducing the editorial workflow.
update public.teams
set editorial_status = 'published'
where is_published is true and editorial_status <> 'published';
