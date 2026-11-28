-- Polisportiva Nino Romano V2 - database foundation
-- PostgreSQL 17 / Supabase. Reviewed against the existing project schema.
-- Keep this file synchronized with the applied Supabase migration.

alter table public.admin_users
  add column role text not null default 'reader',
  add column is_active boolean not null default true,
  add constraint admin_users_role_check
    check (role in ('reader', 'editor', 'publisher', 'administrator'));

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_on <= ends_on)
);
create unique index seasons_one_current_idx on public.seasons (is_current) where is_current;

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'nrm-media' check (bucket_id = 'nrm-media'),
  storage_key text not null unique,
  file_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/avif')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  alt_text text not null default '',
  is_decorative boolean not null default false,
  caption text,
  is_public boolean not null default false,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  check (is_decorative or length(btrim(alt_text)) > 0)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 120),
  slug text not null,
  category text not null check (category in ('senior','youth')),
  description text,
  logo_asset_id uuid references public.media_assets(id) on delete set null,
  is_published boolean not null default false,
  display_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, slug)
);
create index teams_public_order_idx on public.teams (is_published, display_order);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  jersey_number smallint check (jersey_number between 0 and 99),
  position text,
  biography text,
  photo_asset_id uuid references public.media_assets(id) on delete set null,
  is_published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index team_members_jersey_unique_idx on public.team_members (team_id, jersey_number) where jersey_number is not null;
create index team_members_public_order_idx on public.team_members (team_id, is_published, display_order);

create table public.team_staff (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  role_label text not null check (length(btrim(role_label)) between 1 and 120),
  biography text,
  photo_asset_id uuid references public.media_assets(id) on delete set null,
  is_published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index team_staff_public_order_idx on public.team_staff (team_id, is_published, display_order);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) on delete restrict,
  event_type text not null default 'match' check (event_type in ('match','training','club-event','other')),
  round_label text,
  starts_at timestamptz not null,
  home_team text not null,
  away_team text not null,
  venue text,
  competition text,
  status text not null default 'scheduled' check (status in ('scheduled','postponed','cancelled','completed')),
  home_score integer,
  away_score integer,
  notes text,
  is_published boolean not null default false,
  display_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((home_score is null and away_score is null) or (home_score >= 0 and away_score >= 0)),
  check (status <> 'completed' or event_type <> 'match' or (home_score is not null and away_score is not null))
);
create index events_public_date_idx on public.events (is_published, starts_at);

create table public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  published_revision_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.news_revisions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft','in-review','approved','published','rejected','archived')),
  title text not null check (length(btrim(title)) between 1 and 180),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category text not null check (category in ('official','match-report','interview','youth','club-life')),
  excerpt text not null check (length(btrim(excerpt)) between 1 and 500),
  body text not null check (length(btrim(body)) > 0),
  seo_title text,
  seo_description text,
  image_url text,
  image_alt text not null default '',
  image_asset_id uuid references public.media_assets(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (review_note is null or length(review_note) <= 1000),
  submitted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, version)
);
alter table public.news_articles
  add constraint news_articles_published_revision_fk
  foreign key (published_revision_id) references public.news_revisions(id)
  on delete set null deferrable initially deferred;
create index news_revisions_article_version_idx on public.news_revisions (article_id, version desc);
create index news_revisions_review_queue_idx on public.news_revisions (status, submitted_at desc);
create index news_articles_public_idx on public.news_articles (published_at desc) where published_revision_id is not null;

create table public.club_profile (
  id text primary key default 'main' check (id = 'main'),
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create table public.site_settings (
  id text primary key default 'main' check (id = 'main'),
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.editorial_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null check (action in ('insert','update','delete','create','submit','approve','reject','publish','unpublish','archive','restore','role-change')),
  entity_type text not null,
  entity_id text,
  occurred_at timestamptz not null default now(),
  summary jsonb not null default '{}'::jsonb
);
create index editorial_audit_log_occurred_idx on public.editorial_audit_log (occurred_at desc);
create index editorial_audit_log_entity_idx on public.editorial_audit_log (entity_type, entity_id, occurred_at desc);

-- Enable RLS on all new exposed tables.
alter table public.seasons enable row level security;
alter table public.media_assets enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_staff enable row level security;
alter table public.events enable row level security;
alter table public.news_articles enable row level security;
alter table public.news_revisions enable row level security;
alter table public.club_profile enable row level security;
alter table public.site_settings enable row level security;
alter table public.editorial_audit_log enable row level security;

revoke all on public.seasons, public.media_assets, public.teams, public.team_members,
  public.team_staff, public.events, public.news_articles, public.news_revisions,
  public.club_profile, public.site_settings, public.editorial_audit_log from anon, authenticated;
grant select on public.seasons, public.media_assets, public.teams, public.team_members,
  public.team_staff, public.events, public.news_articles, public.news_revisions,
  public.club_profile, public.site_settings to anon, authenticated;
grant insert, update, delete on public.seasons, public.media_assets, public.teams,
  public.team_members, public.team_staff, public.events, public.club_profile,
  public.site_settings to authenticated;
grant select on public.editorial_audit_log to authenticated;

-- Seasons
create policy "Public reads published seasons" on public.seasons
  for select to anon, authenticated using (is_published);
create policy "Admins read all seasons" on public.seasons
  for select to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) is not null);
create policy "Editors create draft seasons" on public.seasons
  for insert to authenticated with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published);
create policy "Editors update draft seasons" on public.seasons
  for update to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published)
  with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published);
create policy "Publishers manage seasons" on public.seasons
  for all to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator')) with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator'));

-- Media metadata
create policy "Public reads public media metadata" on public.media_assets
  for select to anon, authenticated using (is_public);
create policy "Admins read all media metadata" on public.media_assets
  for select to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) is not null);
create policy "Editors manage media metadata" on public.media_assets
  for all to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator')) with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator'));

-- Teams
create policy "Public reads published teams" on public.teams
  for select to anon, authenticated using (
    is_published and (season_id is null or exists (
      select 1 from public.seasons s where s.id = season_id and s.is_published
    ))
  );
create policy "Admins read all teams" on public.teams
  for select to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) is not null);
create policy "Editors create draft teams" on public.teams
  for insert to authenticated with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published);
create policy "Editors update draft teams" on public.teams
  for update to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published)
  with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published);
create policy "Publishers manage teams" on public.teams
  for all to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator')) with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator'));

-- Team members (public only when their parent team and season are public)
create policy "Public reads published team members" on public.team_members
  for select to anon, authenticated using (
    is_published and exists (
      select 1 from public.teams t
      where t.id = team_id and t.is_published
        and (t.season_id is null or exists (
          select 1 from public.seasons s where s.id = t.season_id and s.is_published
        ))
    )
  );
create policy "Admins read all team members" on public.team_members
  for select to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) is not null);
create policy "Editors create draft team members" on public.team_members
  for insert to authenticated with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published);
create policy "Editors update draft team members" on public.team_members
  for update to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published)
  with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published);
create policy "Publishers manage team members" on public.team_members
  for all to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator')) with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator'));

-- Team staff
create policy "Public reads published team staff" on public.team_staff
  for select to anon, authenticated using (
    is_published and exists (
      select 1 from public.teams t
      where t.id = team_id and t.is_published
        and (t.season_id is null or exists (
          select 1 from public.seasons s where s.id = t.season_id and s.is_published
        ))
    )
  );
create policy "Admins read all team staff" on public.team_staff
  for select to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) is not null);
create policy "Editors create draft team staff" on public.team_staff
  for insert to authenticated with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published);
create policy "Editors update draft team staff" on public.team_staff
  for update to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published)
  with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published);
create policy "Publishers manage team staff" on public.team_staff
  for all to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator')) with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator'));

-- Calendar
create policy "Public reads published events" on public.events
  for select to anon, authenticated using (
    is_published and (season_id is null or exists (
      select 1 from public.seasons s where s.id = season_id and s.is_published
    ))
  );
create policy "Admins read all events" on public.events
  for select to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) is not null);
create policy "Editors create draft events" on public.events
  for insert to authenticated with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published);
create policy "Editors update draft events" on public.events
  for update to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published)
  with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published);
create policy "Publishers manage events" on public.events
  for all to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator')) with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator'));

-- News: public can read only the currently published revision. Browser writes are
-- deliberately denied until transactional server-side workflow commands exist.
create policy "Public reads published news identities" on public.news_articles
  for select to anon, authenticated using (published_revision_id is not null);
create policy "Admins read all news identities" on public.news_articles
  for select to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) is not null);
create policy "Public reads published news revisions" on public.news_revisions
  for select to anon, authenticated using (
    status = 'published' and exists (
      select 1 from public.news_articles a
      where a.id = article_id and a.published_revision_id = id
    )
  );
create policy "Admins read all news revisions" on public.news_revisions
  for select to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) is not null);

-- Club profile and site settings
create policy "Public reads published club profile" on public.club_profile
  for select to anon, authenticated using (is_published);
create policy "Admins read all club profile" on public.club_profile
  for select to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) is not null);
create policy "Editors manage draft club profile" on public.club_profile
  for all to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published)
  with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published);
create policy "Publishers manage club profile" on public.club_profile
  for all to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator')) with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator'));

create policy "Public reads published site settings" on public.site_settings
  for select to anon, authenticated using (is_published);
create policy "Admins read all site settings" on public.site_settings
  for select to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) is not null);
create policy "Editors manage draft site settings" on public.site_settings
  for all to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published)
  with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator') and not is_published);
create policy "Publishers manage site settings" on public.site_settings
  for all to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator')) with check ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator'));

-- Audit log is read-only to browser clients; trusted server commands append rows.
create policy "Publishers read editorial audit log" on public.editorial_audit_log
  for select to authenticated using ((select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('publisher','administrator'));
revoke insert, update, delete on public.editorial_audit_log from anon, authenticated;

-- Narrow existing Storage write policies to roles with media-management rights.
drop policy if exists "NRM admins can upload media" on storage.objects;
drop policy if exists "NRM admins can update media" on storage.objects;
drop policy if exists "NRM admins can delete media" on storage.objects;
create policy "NRM editors can upload media" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'nrm-media' and (select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator')
  );
create policy "NRM editors can update media" on storage.objects
  for update to authenticated using (
    bucket_id = 'nrm-media' and (select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator')
  ) with check (
    bucket_id = 'nrm-media' and (select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator')
  );
create policy "NRM editors can delete media" on storage.objects
  for delete to authenticated using (
    bucket_id = 'nrm-media' and (select au.role from public.admin_users au where au.user_id = (select auth.uid()) and au.is_active = true limit 1) in ('editor','publisher','administrator')
  );
