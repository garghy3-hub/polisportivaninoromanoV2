-- News editorial transactional commands and a minimized public projection.
-- All writes are performed through one authenticated RPC; direct table writes stay revoked.

alter table public.news_articles
  add column current_revision_id uuid;

alter table public.news_articles
  add constraint news_articles_current_revision_fk
  foreign key (current_revision_id) references public.news_revisions(id)
  on delete set null deferrable initially deferred;

create index news_articles_current_revision_id_idx
  on public.news_articles(current_revision_id);

-- Do not expose internal article/revision columns to anonymous API clients.
revoke select on public.news_articles from anon;
grant select (id, slug, published_revision_id, published_at)
  on public.news_articles to anon;

revoke select on public.news_revisions from anon;
grant select (
  id, article_id, version, status, title, slug, category, excerpt, body,
  seo_title, seo_description, image_url, image_alt, published_at
) on public.news_revisions to anon;

create or replace view public.news_public_articles
with (security_invoker = true)
as
select
  a.id as article_id,
  r.id as revision_id,
  a.slug,
  a.published_at,
  r.title,
  r.category,
  r.excerpt,
  r.body,
  r.seo_title,
  r.seo_description,
  r.image_url,
  r.image_alt
from public.news_articles a
join public.news_revisions r
  on r.id = a.published_revision_id
 and r.article_id = a.id
 and r.status = 'published'
where a.published_revision_id is not null;

grant select on public.news_public_articles to anon, authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_valid_news_editorial_payload(p_payload jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $function$
  select coalesce((
    pg_catalog.jsonb_typeof(p_payload) = 'object'
    and p_payload ?& array[
      'title', 'slug', 'category', 'excerpt', 'body',
      'seoTitle', 'seoDescription', 'imageUrl', 'imageAlt'
    ]::text[]
    and not exists (
      select 1
      from pg_catalog.jsonb_object_keys(p_payload) as supplied(key)
      where supplied.key <> all (array[
        'title', 'slug', 'category', 'excerpt', 'body',
        'seoTitle', 'seoDescription', 'imageUrl', 'imageAlt'
      ]::text[])
    )
    and pg_catalog.jsonb_typeof(p_payload->'title') = 'string'
    and pg_catalog.jsonb_typeof(p_payload->'slug') = 'string'
    and pg_catalog.jsonb_typeof(p_payload->'category') = 'string'
    and pg_catalog.jsonb_typeof(p_payload->'excerpt') = 'string'
    and pg_catalog.jsonb_typeof(p_payload->'body') = 'string'
    and pg_catalog.jsonb_typeof(p_payload->'seoTitle') = 'string'
    and pg_catalog.jsonb_typeof(p_payload->'seoDescription') = 'string'
    and pg_catalog.jsonb_typeof(p_payload->'imageUrl') = 'string'
    and pg_catalog.jsonb_typeof(p_payload->'imageAlt') = 'string'
    and pg_catalog.length(pg_catalog.btrim(p_payload->>'title')) between 1 and 140
    and pg_catalog.length(p_payload->>'slug') between 1 and 160
    and (p_payload->>'slug') ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and p_payload->>'category' in ('official', 'match-report', 'interview', 'youth', 'club-life')
    and pg_catalog.length(pg_catalog.btrim(p_payload->>'excerpt')) between 1 and 300
    and pg_catalog.length(pg_catalog.btrim(p_payload->>'body')) between 1 and 20000
    and pg_catalog.length(p_payload->>'seoTitle') <= 70
    and pg_catalog.length(p_payload->>'seoDescription') <= 160
    and pg_catalog.length(p_payload->>'imageUrl') <= 2048
    and pg_catalog.length(p_payload->>'imageAlt') <= 200
    and (
      pg_catalog.btrim(p_payload->>'imageUrl') = ''
      or (p_payload->>'imageUrl') ~* '^https?://'
    )
    and (
      pg_catalog.btrim(p_payload->>'imageUrl') = ''
      or pg_catalog.length(pg_catalog.btrim(p_payload->>'imageAlt')) > 0
    )), false);
$function$;

revoke all on function private.is_valid_news_editorial_payload(jsonb)
  from public, anon, authenticated;

create or replace function public.news_editorial_command(
  p_action text,
  p_article_id uuid default null,
  p_revision_id uuid default null,
  p_expected_version integer default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid;
  v_role text;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_article public.news_articles%rowtype;
  v_revision public.news_revisions%rowtype;
  v_decision text;
  v_review_note text;
  v_audit_action text;
  v_status text;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select au.role
    into v_role
  from public.admin_users au
  where au.user_id = v_actor
    and au.is_active = true;

  if not found or v_role not in ('reader', 'editor', 'publisher', 'administrator') then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_action = 'create_draft' then
    if v_role not in ('editor', 'publisher', 'administrator') then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if not private.is_valid_news_editorial_payload(p_payload) then
      raise exception 'invalid_content' using errcode = '22023';
    end if;

    insert into public.news_articles(created_by, updated_at)
    values (v_actor, v_now)
    returning * into v_article;

    insert into public.news_revisions (
      article_id, version, status, title, slug, category, excerpt, body,
      seo_title, seo_description, image_url, image_alt, created_by, updated_by
    )
    values (
      v_article.id, 1, 'draft', p_payload->>'title', p_payload->>'slug',
      p_payload->>'category', p_payload->>'excerpt', p_payload->>'body',
      p_payload->>'seoTitle', p_payload->>'seoDescription',
      nullif(p_payload->>'imageUrl', ''), p_payload->>'imageAlt', v_actor, v_actor
    )
    returning * into v_revision;

    update public.news_articles
      set current_revision_id = v_revision.id,
          updated_at = v_now
      where id = v_article.id;

    insert into public.editorial_audit_log (
      actor_id, actor_role, action, entity_type, entity_id, summary
    )
    values (
      v_actor, v_role, 'create', 'news-article', v_article.id::text,
      pg_catalog.jsonb_build_object('status', 'draft', 'version', 1, 'slug', v_revision.slug)
    );

  elsif p_action = 'update_draft' then
    if v_role not in ('editor', 'publisher', 'administrator') then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if p_article_id is null or p_revision_id is null or p_expected_version is null
       or not private.is_valid_news_editorial_payload(p_payload) then
      raise exception 'invalid_request' using errcode = '22023';
    end if;

    select a.* into v_article
    from public.news_articles a
    where a.id = p_article_id
      and a.current_revision_id = p_revision_id
    for update;

    if not found then
      raise exception 'not_found' using errcode = 'P0002';
    end if;

    select r.* into v_revision
    from public.news_revisions r
    where r.id = p_revision_id
      and r.article_id = p_article_id
    for update;

    if not found then
      raise exception 'not_found' using errcode = 'P0002';
    end if;
    if v_revision.version <> p_expected_version then
      raise exception 'version_conflict' using errcode = '40001';
    end if;
    if v_revision.status not in ('draft', 'rejected') then
      raise exception 'invalid_transition' using errcode = '22023';
    end if;

    insert into public.news_revisions (
      article_id, version, status, title, slug, category, excerpt, body,
      seo_title, seo_description, image_url, image_alt, created_by, updated_by
    )
    values (
      p_article_id, v_revision.version + 1, 'draft',
      p_payload->>'title', p_payload->>'slug', p_payload->>'category',
      p_payload->>'excerpt', p_payload->>'body', p_payload->>'seoTitle',
      p_payload->>'seoDescription', nullif(p_payload->>'imageUrl', ''),
      p_payload->>'imageAlt', v_actor, v_actor
    )
    returning * into v_revision;

    update public.news_articles
      set current_revision_id = v_revision.id,
          updated_at = v_now
      where id = p_article_id;

    insert into public.editorial_audit_log (
      actor_id, actor_role, action, entity_type, entity_id, summary
    )
    values (
      v_actor, v_role, 'update', 'news-article', p_article_id::text,
      pg_catalog.jsonb_build_object('status', 'draft', 'version', v_revision.version, 'slug', v_revision.slug)
    );

  elsif p_action = 'submit_for_review' then
    if v_role not in ('editor', 'publisher', 'administrator') then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if p_article_id is null or p_revision_id is null or p_expected_version is null then
      raise exception 'invalid_request' using errcode = '22023';
    end if;

    select a.* into v_article
    from public.news_articles a
    where a.id = p_article_id and a.current_revision_id = p_revision_id
    for update;
    if not found then raise exception 'not_found' using errcode = 'P0002'; end if;

    select r.* into v_revision
    from public.news_revisions r
    where r.id = p_revision_id and r.article_id = p_article_id
    for update;
    if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
    if v_revision.version <> p_expected_version then
      raise exception 'version_conflict' using errcode = '40001';
    end if;
    if v_revision.status <> 'draft' then
      raise exception 'invalid_transition' using errcode = '22023';
    end if;

    update public.news_revisions
      set status = 'in-review',
          version = version + 1,
          submitted_at = v_now,
          updated_at = v_now,
          updated_by = v_actor
      where id = p_revision_id
      returning * into v_revision;

    update public.news_articles set updated_at = v_now where id = p_article_id;

    insert into public.editorial_audit_log (
      actor_id, actor_role, action, entity_type, entity_id, summary
    )
    values (
      v_actor, v_role, 'submit', 'news-article', p_article_id::text,
      pg_catalog.jsonb_build_object('status', 'in-review', 'version', v_revision.version)
    );

  elsif p_action = 'review_decision' then
    if v_role not in ('publisher', 'administrator') then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if p_article_id is null or p_revision_id is null or p_expected_version is null
       or pg_catalog.jsonb_typeof(p_payload) <> 'object'
       or not (p_payload ? 'decision')
       or exists (
         select 1 from pg_catalog.jsonb_object_keys(p_payload) as supplied(key)
         where supplied.key <> all (array['decision', 'reviewNote']::text[])
       )
       or (p_payload ? 'reviewNote' and pg_catalog.jsonb_typeof(p_payload->'reviewNote') <> 'string') then
      raise exception 'invalid_request' using errcode = '22023';
    end if;

    v_decision := p_payload->>'decision';
    v_review_note := pg_catalog.btrim(coalesce(p_payload->>'reviewNote', ''));
    if v_decision is null or v_decision not in ('approved', 'rejected')
       or (v_decision = 'rejected' and pg_catalog.length(v_review_note) = 0)
       or pg_catalog.length(v_review_note) > 1000 then
      raise exception 'invalid_review_decision' using errcode = '22023';
    end if;

    select a.* into v_article
    from public.news_articles a
    where a.id = p_article_id and a.current_revision_id = p_revision_id
    for update;
    if not found then raise exception 'not_found' using errcode = 'P0002'; end if;

    select r.* into v_revision
    from public.news_revisions r
    where r.id = p_revision_id and r.article_id = p_article_id
    for update;
    if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
    if v_revision.version <> p_expected_version then
      raise exception 'version_conflict' using errcode = '40001';
    end if;
    if v_revision.status <> 'in-review' then
      raise exception 'invalid_transition' using errcode = '22023';
    end if;
    if v_revision.created_by = v_actor then
      raise exception 'separation_of_duties' using errcode = '42501';
    end if;

    update public.news_revisions
      set status = v_decision,
          version = version + 1,
          reviewer_id = v_actor,
          reviewed_at = v_now,
          review_note = nullif(v_review_note, ''),
          updated_at = v_now,
          updated_by = v_actor
      where id = p_revision_id
      returning * into v_revision;

    update public.news_articles set updated_at = v_now where id = p_article_id;
    v_audit_action := case when v_decision = 'approved' then 'approve' else 'reject' end;

    insert into public.editorial_audit_log (
      actor_id, actor_role, action, entity_type, entity_id, summary
    )
    values (
      v_actor, v_role, v_audit_action, 'news-article', p_article_id::text,
      pg_catalog.jsonb_build_object('status', v_decision, 'version', v_revision.version)
    );

  elsif p_action = 'publish' then
    if v_role not in ('publisher', 'administrator') then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if p_article_id is null or p_revision_id is null or p_expected_version is null then
      raise exception 'invalid_request' using errcode = '22023';
    end if;

    select a.* into v_article
    from public.news_articles a
    where a.id = p_article_id and a.current_revision_id = p_revision_id
    for update;
    if not found then raise exception 'not_found' using errcode = 'P0002'; end if;

    select r.* into v_revision
    from public.news_revisions r
    where r.id = p_revision_id and r.article_id = p_article_id
    for update;
    if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
    if v_revision.version <> p_expected_version then
      raise exception 'version_conflict' using errcode = '40001';
    end if;
    if v_revision.status <> 'approved' then
      raise exception 'invalid_transition' using errcode = '22023';
    end if;

    update public.news_revisions
      set status = 'published',
          version = version + 1,
          published_at = v_now,
          updated_at = v_now,
          updated_by = v_actor
      where id = p_revision_id
      returning * into v_revision;

    update public.news_articles
      set published_revision_id = p_revision_id,
          slug = v_revision.slug,
          published_at = v_now,
          updated_at = v_now
      where id = p_article_id;

    insert into public.editorial_audit_log (
      actor_id, actor_role, action, entity_type, entity_id, summary
    )
    values (
      v_actor, v_role, 'publish', 'news-article', p_article_id::text,
      pg_catalog.jsonb_build_object('status', 'published', 'version', v_revision.version, 'slug', v_revision.slug)
    );

  elsif p_action in ('unpublish', 'archive') then
    if v_role not in ('publisher', 'administrator') then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if p_article_id is null or p_revision_id is null or p_expected_version is null then
      raise exception 'invalid_request' using errcode = '22023';
    end if;

    select a.* into v_article
    from public.news_articles a
    where a.id = p_article_id
      and a.current_revision_id = p_revision_id
      and a.published_revision_id = p_revision_id
    for update;
    if not found then raise exception 'not_found' using errcode = 'P0002'; end if;

    select r.* into v_revision
    from public.news_revisions r
    where r.id = p_revision_id and r.article_id = p_article_id
    for update;
    if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
    if v_revision.version <> p_expected_version then
      raise exception 'version_conflict' using errcode = '40001';
    end if;
    if v_revision.status <> 'published' then
      raise exception 'invalid_transition' using errcode = '22023';
    end if;

    v_status := case when p_action = 'archive' then 'archived' else 'draft' end;
    update public.news_revisions
      set status = v_status,
          version = version + 1,
          published_at = null,
          updated_at = v_now,
          updated_by = v_actor
      where id = p_revision_id
      returning * into v_revision;

    update public.news_articles
      set published_revision_id = null,
          slug = null,
          published_at = null,
          updated_at = v_now
      where id = p_article_id;

    v_audit_action := case when p_action = 'archive' then 'archive' else 'unpublish' end;
    insert into public.editorial_audit_log (
      actor_id, actor_role, action, entity_type, entity_id, summary
    )
    values (
      v_actor, v_role, v_audit_action, 'news-article', p_article_id::text,
      pg_catalog.jsonb_build_object('status', v_status, 'version', v_revision.version)
    );

  elsif p_action = 'restore' then
    if v_role not in ('publisher', 'administrator') then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if p_article_id is null or p_revision_id is null or p_expected_version is null then
      raise exception 'invalid_request' using errcode = '22023';
    end if;

    select a.* into v_article
    from public.news_articles a
    where a.id = p_article_id
      and a.current_revision_id = p_revision_id
      and a.published_revision_id is null
    for update;
    if not found then raise exception 'not_found' using errcode = 'P0002'; end if;

    select r.* into v_revision
    from public.news_revisions r
    where r.id = p_revision_id and r.article_id = p_article_id
    for update;
    if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
    if v_revision.version <> p_expected_version then
      raise exception 'version_conflict' using errcode = '40001';
    end if;
    if v_revision.status <> 'archived' then
      raise exception 'invalid_transition' using errcode = '22023';
    end if;

    update public.news_revisions
      set status = 'draft',
          version = version + 1,
          updated_at = v_now,
          updated_by = v_actor
      where id = p_revision_id
      returning * into v_revision;

    update public.news_articles set updated_at = v_now where id = p_article_id;

    insert into public.editorial_audit_log (
      actor_id, actor_role, action, entity_type, entity_id, summary
    )
    values (
      v_actor, v_role, 'restore', 'news-article', p_article_id::text,
      pg_catalog.jsonb_build_object('status', 'draft', 'version', v_revision.version)
    );

  else
    raise exception 'unsupported_action' using errcode = '22023';
  end if;

  return pg_catalog.jsonb_build_object(
    'articleId', v_revision.article_id,
    'revision', pg_catalog.to_jsonb(v_revision),
    'version', v_revision.version
  );
end;
$function$;

revoke all on function public.news_editorial_command(text, uuid, uuid, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.news_editorial_command(text, uuid, uuid, integer, jsonb)
  to authenticated;

comment on function public.news_editorial_command(text, uuid, uuid, integer, jsonb)
  is 'Authenticated, role-checked transactional news editorial workflow. Direct table writes remain disabled.';
