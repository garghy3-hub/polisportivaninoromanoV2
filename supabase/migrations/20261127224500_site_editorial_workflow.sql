-- Transactional editorial workflow for the singleton site settings and club profile.
-- The current public content remains in content; draft_content is never exposed publicly.
-- Apply only after verifying the live schema and the existing RLS grants.

alter table public.site_settings
  add column if not exists draft_content jsonb,
  add column if not exists editorial_status text not null default 'draft',
  add column if not exists draft_created_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewer_id uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text,
  add column if not exists submitted_at timestamptz,
  add column if not exists published_at timestamptz;

alter table public.club_profile
  add column if not exists draft_content jsonb,
  add column if not exists editorial_status text not null default 'draft',
  add column if not exists draft_created_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewer_id uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text,
  add column if not exists submitted_at timestamptz,
  add column if not exists published_at timestamptz;

alter table public.site_settings
  add constraint site_settings_editorial_status_check
  check (editorial_status in ('draft','in-review','approved','published','rejected'));
alter table public.club_profile
  add constraint club_profile_editorial_status_check
  check (editorial_status in ('draft','in-review','approved','published','rejected'));

update public.site_settings
set editorial_status = case when is_published then 'published' else 'draft' end,
    published_at = case when is_published then updated_at else null end
where editorial_status = 'draft' and is_published;

update public.club_profile
set editorial_status = case when is_published then 'published' else 'draft' end,
    published_at = case when is_published then updated_at else null end
where editorial_status = 'draft' and is_published;

create index if not exists site_settings_editorial_queue_idx
  on public.site_settings (editorial_status, updated_at desc);
create index if not exists club_profile_editorial_queue_idx
  on public.club_profile (editorial_status, updated_at desc);

-- Browser clients may read published projections but cannot write singleton content directly.
revoke insert, update, delete on public.site_settings, public.club_profile from anon, authenticated;
revoke select on public.site_settings, public.club_profile from anon;
grant select (id, content, is_published, updated_at)
  on public.site_settings, public.club_profile to anon;
grant select on public.site_settings, public.club_profile to authenticated;

create or replace function public.site_editorial_command(
  p_resource text,
  p_action text,
  p_expected_updated_at timestamptz default null,
  p_payload jsonb default null,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_table text;
  v_entity text;
  v_row record;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_status text;
  v_audit_action text;
  v_note text := pg_catalog.btrim(coalesce(p_note, ''));
begin
  if v_actor is null then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'unauthenticated');
  end if;

  select au.role into v_role
  from public.admin_users au
  where au.user_id = v_actor and au.is_active = true;

  if not found or v_role not in ('editor','publisher','administrator') then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  if p_resource = 'site-settings' then
    v_table := 'site_settings';
    v_entity := 'site-settings';
  elsif p_resource = 'club-profile' then
    v_table := 'club_profile';
    v_entity := 'club-profile';
  else
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_resource');
  end if;

  if p_action = 'save_draft' then
    if pg_catalog.jsonb_typeof(p_payload) <> 'object'
       or pg_catalog.pg_column_size(p_payload) > 262144
       or p_expected_updated_at is not null then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_payload');
    end if;
    if p_resource = 'site-settings'
       and (not (p_payload ?& array['interface','brand','site','navigation','home','news','teams','calendar','society','footer']::text[])
         or pg_catalog.jsonb_typeof(p_payload->'navigation') <> 'array'
         or pg_catalog.jsonb_typeof(p_payload->'home') <> 'object'
         or pg_catalog.jsonb_typeof(p_payload->'site') <> 'object') then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_payload');
    end if;
    if p_resource = 'club-profile'
       and (pg_catalog.jsonb_typeof(p_payload->'name') <> 'string'
         or pg_catalog.length(pg_catalog.btrim(p_payload->>'name')) not between 1 and 160
         or (p_payload ? 'contacts' and pg_catalog.jsonb_typeof(p_payload->'contacts') <> 'array')
         or (p_payload ? 'socialLinks' and pg_catalog.jsonb_typeof(p_payload->'socialLinks') <> 'array')
         or (p_payload ? 'people' and pg_catalog.jsonb_typeof(p_payload->'people') <> 'array')
         or (p_payload ? 'partners' and pg_catalog.jsonb_typeof(p_payload->'partners') <> 'array')) then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_payload');
    end if;

    execute pg_catalog.format(
      'select id, updated_at, editorial_status, is_published from public.%I where id = $1 for update',
      v_table
    ) into v_row using 'main';

    if not found then
      execute pg_catalog.format(
        'insert into public.%I (id, content, draft_content, editorial_status, draft_created_by, updated_by, updated_at) values ($1, ''{}''::jsonb, $2, ''draft'', $3, $3, $4) returning id, updated_at, editorial_status',
        v_table
      ) into v_row using 'main', p_payload, v_actor, v_now;
    else
      if v_row.editorial_status not in ('draft','rejected','published') then
        return pg_catalog.jsonb_build_object('ok', false, 'code', 'not_editable');
      end if;
      if p_expected_updated_at is not null then
        return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_payload');
      end if;
      execute pg_catalog.format(
        'update public.%I set draft_content = $1, editorial_status = ''draft'', draft_created_by = $2, reviewer_id = null, reviewed_at = null, review_note = null, submitted_at = null, updated_by = $2, updated_at = $3 where id = $4 returning id, updated_at, editorial_status',
        v_table
      ) into v_row using p_payload, v_actor, v_now, 'main';
    end if;

    insert into public.editorial_audit_log(actor_id, actor_role, action, entity_type, entity_id, summary)
    values (v_actor, v_role, 'update', v_entity, 'main',
      pg_catalog.jsonb_build_object('status','draft','resource',p_resource));

    return pg_catalog.jsonb_build_object('ok',true,'resource',p_resource,
      'updatedAt',v_row.updated_at,'editorialStatus','draft');

  elsif p_action in ('submit','approve','reject','publish','unpublish') then
    if p_expected_updated_at is null or p_payload is not null then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_request');
    end if;
    if p_action in ('approve','reject','publish','unpublish')
       and v_role not in ('publisher','administrator') then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'forbidden');
    end if;
    if p_action = 'reject' and (pg_catalog.length(v_note) = 0 or pg_catalog.length(v_note) > 1000) then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_note');
    elsif p_action <> 'reject' and v_note <> '' then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_note');
    end if;

    execute pg_catalog.format(
      'select id, updated_at, editorial_status, draft_created_by, draft_content, content from public.%I where id = $1 for update',
      v_table
    ) into v_row using 'main';
    if not found then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'not_found');
    end if;
    if v_row.updated_at <> p_expected_updated_at then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'conflict');
    end if;

    if p_action = 'submit' then
      if v_role not in ('editor','publisher','administrator') or v_row.editorial_status <> 'draft' or v_row.draft_content is null then
        return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_transition');
      end if;
      v_status := 'in-review';
      v_audit_action := 'submit';
      execute pg_catalog.format(
        'update public.%I set editorial_status=$1, submitted_at=$2, reviewer_id=null, reviewed_at=null, review_note=null, updated_by=$3, updated_at=$2 where id=$4 returning updated_at',
        v_table
      ) into v_row using v_status, v_now, v_actor, 'main';

    elsif p_action in ('approve','reject') then
      if v_row.editorial_status <> 'in-review' then
        return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_transition');
      end if;
      if v_row.draft_created_by = v_actor then
        return pg_catalog.jsonb_build_object('ok', false, 'code', 'separation_of_duties');
      end if;
      v_status := case when p_action = 'approve' then 'approved' else 'rejected' end;
      v_audit_action := p_action;
      execute pg_catalog.format(
        'update public.%I set editorial_status=$1, reviewer_id=$2, reviewed_at=$3, review_note=$4, updated_by=$2, updated_at=$3 where id=$5 returning updated_at',
        v_table
      ) into v_row using v_status, v_actor, v_now, nullif(v_note,''), 'main';

    elsif p_action = 'publish' then
      if v_row.editorial_status <> 'approved' or v_row.draft_content is null then
        return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_transition');
      end if;
      v_status := 'published';
      v_audit_action := 'publish';
      execute pg_catalog.format(
        'update public.%I set content=draft_content, draft_content=null, is_published=true, editorial_status=$1, published_at=$2, updated_by=$3, updated_at=$2 where id=$4 returning updated_at',
        v_table
      ) into v_row using v_status, v_now, v_actor, 'main';

    else
      if v_row.editorial_status <> 'published' then
        return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_transition');
      end if;
      v_status := 'draft';
      v_audit_action := 'unpublish';
      execute pg_catalog.format(
        'update public.%I set draft_content=content, draft_created_by=$1, is_published=false, editorial_status=$2, published_at=null, reviewer_id=null, reviewed_at=null, review_note=null, submitted_at=null, updated_by=$1, updated_at=$3 where id=$4 returning updated_at',
        v_table
      ) into v_row using v_actor, v_status, v_now, 'main';
    end if;

    insert into public.editorial_audit_log(actor_id, actor_role, action, entity_type, entity_id, summary)
    values (v_actor, v_role, v_audit_action, v_entity, 'main',
      pg_catalog.jsonb_build_object('status',v_status,'resource',p_resource));

    return pg_catalog.jsonb_build_object('ok',true,'resource',p_resource,
      'updatedAt',v_row.updated_at,'editorialStatus',v_status);
  end if;

  return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_action');
end;
$function$;

revoke all on function public.site_editorial_command(text,text,timestamptz,jsonb,text)
  from public, anon, authenticated;
grant execute on function public.site_editorial_command(text,text,timestamptz,jsonb,text)
  to authenticated;
