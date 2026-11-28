-- V2 database hardening: foreign-key indexes and non-overlapping RLS policies.
-- Apply after v2_database_foundation.

create index if not exists club_profile_updated_by_idx on public.club_profile(updated_by);
create index if not exists editorial_audit_log_actor_id_idx on public.editorial_audit_log(actor_id);
create index if not exists events_created_by_idx on public.events(created_by);
create index if not exists events_season_id_idx on public.events(season_id);
create index if not exists events_updated_by_idx on public.events(updated_by);
create index if not exists media_assets_uploaded_by_idx on public.media_assets(uploaded_by);
create index if not exists news_articles_created_by_idx on public.news_articles(created_by);
create index if not exists news_articles_published_revision_id_idx on public.news_articles(published_revision_id);
create index if not exists news_revisions_created_by_idx on public.news_revisions(created_by);
create index if not exists news_revisions_image_asset_id_idx on public.news_revisions(image_asset_id);
create index if not exists news_revisions_reviewer_id_idx on public.news_revisions(reviewer_id);
create index if not exists news_revisions_updated_by_idx on public.news_revisions(updated_by);
create index if not exists site_settings_updated_by_idx on public.site_settings(updated_by);
create index if not exists team_members_photo_asset_id_idx on public.team_members(photo_asset_id);
create index if not exists team_staff_photo_asset_id_idx on public.team_staff(photo_asset_id);
create index if not exists teams_created_by_idx on public.teams(created_by);
create index if not exists teams_logo_asset_id_idx on public.teams(logo_asset_id);
create index if not exists teams_updated_by_idx on public.teams(updated_by);

-- Optimize the existing administrator self-read policy and make site_content
-- writable only by active Administrators (it remains public-read-only content).
alter policy "Admins can read own admin record" on public.admin_users
  using (user_id = (select auth.uid()));
alter policy "Admins can delete site content" on public.site_content
  using (exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.is_active = true and au.role = 'administrator'
  ));
alter policy "Admins can insert site content" on public.site_content
  with check (exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.is_active = true and au.role = 'administrator'
  ));
alter policy "Admins can update site content" on public.site_content
  using (exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.is_active = true and au.role = 'administrator'
  ))
  with check (exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.is_active = true and au.role = 'administrator'
  ));

-- Seasons: one public and one authenticated read policy; no overlapping ALL policy.
drop policy if exists "Public reads published seasons" on public.seasons;
drop policy if exists "Admins read all seasons" on public.seasons;
drop policy if exists "Editors create draft seasons" on public.seasons;
drop policy if exists "Editors update draft seasons" on public.seasons;
drop policy if exists "Publishers manage seasons" on public.seasons;
create policy "Public reads published seasons" on public.seasons
  for select to anon using (is_published);
create policy "Authenticated reads seasons" on public.seasons
  for select to authenticated using (
    is_published or exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active
    )
  );
create policy "Authorized creates seasons" on public.seasons
  for insert to authenticated with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active
      and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (
      select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active
        and au.role in ('publisher','administrator')
    ))
  );
create policy "Authorized updates seasons" on public.seasons
  for update to authenticated using (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active
      and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (
      select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active
        and au.role in ('publisher','administrator')
    ))
  ) with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active
      and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (
      select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active
        and au.role in ('publisher','administrator')
    ))
  );
create policy "Publishers delete seasons" on public.seasons
  for delete to authenticated using (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('publisher','administrator'))
  );

-- Media assets
drop policy if exists "Public reads public media metadata" on public.media_assets;
drop policy if exists "Admins read all media metadata" on public.media_assets;
drop policy if exists "Editors manage media metadata" on public.media_assets;
create policy "Public reads public media metadata" on public.media_assets
  for select to anon using (is_public);
create policy "Authenticated reads media metadata" on public.media_assets
  for select to authenticated using (
    is_public or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active)
  );
create policy "Authorized inserts media metadata" on public.media_assets
  for insert to authenticated with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
  );
create policy "Authorized updates media metadata" on public.media_assets
  for update to authenticated using (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
  ) with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
  );
create policy "Authorized deletes media metadata" on public.media_assets
  for delete to authenticated using (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
  );

-- Teams
drop policy if exists "Public reads published teams" on public.teams;
drop policy if exists "Admins read all teams" on public.teams;
drop policy if exists "Editors create draft teams" on public.teams;
drop policy if exists "Editors update draft teams" on public.teams;
drop policy if exists "Publishers manage teams" on public.teams;
create policy "Public reads published teams" on public.teams
  for select to anon using (is_published and (season_id is null or exists (
    select 1 from public.seasons s where s.id = season_id and s.is_published
  )));
create policy "Authenticated reads teams" on public.teams
  for select to authenticated using (
    (is_published and (season_id is null or exists (
      select 1 from public.seasons s where s.id = season_id and s.is_published
    ))) or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active)
  );
create policy "Authorized inserts teams" on public.teams
  for insert to authenticated with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  );
create policy "Authorized updates teams" on public.teams
  for update to authenticated using (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  ) with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  );
create policy "Publishers delete teams" on public.teams
  for delete to authenticated using (exists (select 1 from public.admin_users au
    where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')));

-- Team members
drop policy if exists "Public reads published team members" on public.team_members;
drop policy if exists "Admins read all team members" on public.team_members;
drop policy if exists "Editors create draft team members" on public.team_members;
drop policy if exists "Editors update draft team members" on public.team_members;
drop policy if exists "Publishers manage team members" on public.team_members;
create policy "Public reads published team members" on public.team_members
  for select to anon using (is_published and exists (
    select 1 from public.teams t where t.id = team_id and t.is_published
      and (t.season_id is null or exists (select 1 from public.seasons s
        where s.id = t.season_id and s.is_published))
  ));
create policy "Authenticated reads team members" on public.team_members
  for select to authenticated using (
    (is_published and exists (select 1 from public.teams t where t.id = team_id and t.is_published
      and (t.season_id is null or exists (select 1 from public.seasons s
        where s.id = t.season_id and s.is_published))))
    or exists (select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active)
  );
create policy "Authorized inserts team members" on public.team_members
  for insert to authenticated with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  );
create policy "Authorized updates team members" on public.team_members
  for update to authenticated using (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  ) with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  );
create policy "Publishers delete team members" on public.team_members
  for delete to authenticated using (exists (select 1 from public.admin_users au
    where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')));

-- Team staff
drop policy if exists "Public reads published team staff" on public.team_staff;
drop policy if exists "Admins read all team staff" on public.team_staff;
drop policy if exists "Editors create draft team staff" on public.team_staff;
drop policy if exists "Editors update draft team staff" on public.team_staff;
drop policy if exists "Publishers manage team staff" on public.team_staff;
create policy "Public reads published team staff" on public.team_staff
  for select to anon using (is_published and exists (
    select 1 from public.teams t where t.id = team_id and t.is_published
      and (t.season_id is null or exists (select 1 from public.seasons s
        where s.id = t.season_id and s.is_published))
  ));
create policy "Authenticated reads team staff" on public.team_staff
  for select to authenticated using (
    (is_published and exists (select 1 from public.teams t where t.id = team_id and t.is_published
      and (t.season_id is null or exists (select 1 from public.seasons s
        where s.id = t.season_id and s.is_published))))
    or exists (select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active)
  );
create policy "Authorized inserts team staff" on public.team_staff
  for insert to authenticated with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  );
create policy "Authorized updates team staff" on public.team_staff
  for update to authenticated using (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  ) with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  );
create policy "Publishers delete team staff" on public.team_staff
  for delete to authenticated using (exists (select 1 from public.admin_users au
    where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')));

-- Events
drop policy if exists "Public reads published events" on public.events;
drop policy if exists "Admins read all events" on public.events;
drop policy if exists "Editors create draft events" on public.events;
drop policy if exists "Editors update draft events" on public.events;
drop policy if exists "Publishers manage events" on public.events;
create policy "Public reads published events" on public.events
  for select to anon using (is_published and (season_id is null or exists (
    select 1 from public.seasons s where s.id = season_id and s.is_published
  )));
create policy "Authenticated reads events" on public.events
  for select to authenticated using (
    (is_published and (season_id is null or exists (
      select 1 from public.seasons s where s.id = season_id and s.is_published
    ))) or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active)
  );
create policy "Authorized inserts events" on public.events
  for insert to authenticated with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  );
create policy "Authorized updates events" on public.events
  for update to authenticated using (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  ) with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  );
create policy "Publishers delete events" on public.events
  for delete to authenticated using (exists (select 1 from public.admin_users au
    where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')));

-- News
drop policy if exists "Public reads published news identities" on public.news_articles;
drop policy if exists "Admins read all news identities" on public.news_articles;
drop policy if exists "Public reads published news revisions" on public.news_revisions;
drop policy if exists "Admins read all news revisions" on public.news_revisions;
create policy "Public reads published news identities" on public.news_articles
  for select to anon using (published_revision_id is not null);
create policy "Authenticated reads news identities" on public.news_articles
  for select to authenticated using (
    published_revision_id is not null or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active)
  );
create policy "Public reads published news revisions" on public.news_revisions
  for select to anon using (status = 'published' and exists (
    select 1 from public.news_articles a where a.id = article_id and a.published_revision_id = id
  ));
create policy "Authenticated reads news revisions" on public.news_revisions
  for select to authenticated using (
    (status = 'published' and exists (
      select 1 from public.news_articles a where a.id = article_id and a.published_revision_id = id
    )) or exists (select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active)
  );

-- Club profile and site settings
drop policy if exists "Public reads published club profile" on public.club_profile;
drop policy if exists "Admins read all club profile" on public.club_profile;
drop policy if exists "Editors manage draft club profile" on public.club_profile;
drop policy if exists "Publishers manage club profile" on public.club_profile;
create policy "Public reads published club profile" on public.club_profile
  for select to anon using (is_published);
create policy "Authenticated reads club profile" on public.club_profile
  for select to authenticated using (is_published or exists (
    select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active
  ));
create policy "Authorized inserts club profile" on public.club_profile
  for insert to authenticated with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  );
create policy "Authorized updates club profile" on public.club_profile
  for update to authenticated using (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  ) with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  );
create policy "Publishers delete club profile" on public.club_profile
  for delete to authenticated using (exists (select 1 from public.admin_users au
    where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')));

drop policy if exists "Public reads published site settings" on public.site_settings;
drop policy if exists "Admins read all site settings" on public.site_settings;
drop policy if exists "Editors manage draft site settings" on public.site_settings;
drop policy if exists "Publishers manage site settings" on public.site_settings;
create policy "Public reads published site settings" on public.site_settings
  for select to anon using (is_published);
create policy "Authenticated reads site settings" on public.site_settings
  for select to authenticated using (is_published or exists (
    select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active
  ));
create policy "Authorized inserts site settings" on public.site_settings
  for insert to authenticated with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  );
create policy "Authorized updates site settings" on public.site_settings
  for update to authenticated using (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  ) with check (
    exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('editor','publisher','administrator'))
    and (not is_published or exists (select 1 from public.admin_users au
      where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')))
  );
create policy "Publishers delete site settings" on public.site_settings
  for delete to authenticated using (exists (select 1 from public.admin_users au
    where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')));

-- Audit log
drop policy if exists "Publishers read editorial audit log" on public.editorial_audit_log;
create policy "Publishers read editorial audit log" on public.editorial_audit_log
  for select to authenticated using (exists (select 1 from public.admin_users au
    where au.user_id = (select auth.uid()) and au.is_active and au.role in ('publisher','administrator')));
