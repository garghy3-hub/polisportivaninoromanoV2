-- Transactional shared draft persistence for teams and roster.
-- Direct browser DML is revoked; all writes go through the authenticated RPC.

revoke insert, update, delete on public.teams, public.team_members, public.team_staff
  from anon, authenticated;

create or replace function private.team_editorial_command(
  p_action text,
  p_team_id uuid default null,
  p_expected_updated_at timestamptz default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_team public.teams%rowtype;
  v_season_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_action text;
  v_member jsonb;
  v_staff jsonb;
  v_index integer := 0;
begin
  if v_actor is null then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'unauthenticated');
  end if;

  select au.role into v_role
  from public.admin_users au
  where au.user_id = v_actor and au.is_active = true;

  if v_role is null or v_role not in ('editor', 'publisher', 'administrator') then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  if p_action <> 'save_draft' then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_action');
  end if;

  if pg_catalog.jsonb_typeof(p_payload) <> 'object'
    or not (p_payload ?& array['name','slug','category','seasonLabel','description','roster','staff']::text[])
    or exists (
      select 1 from pg_catalog.jsonb_object_keys(p_payload) as supplied(key)
      where supplied.key <> all (array['name','slug','category','seasonLabel','description','roster','staff']::text[])
    )
    or pg_catalog.jsonb_typeof(p_payload->'name') <> 'string'
    or pg_catalog.jsonb_typeof(p_payload->'slug') <> 'string'
    or pg_catalog.jsonb_typeof(p_payload->'category') <> 'string'
    or pg_catalog.jsonb_typeof(p_payload->'seasonLabel') <> 'string'
    or pg_catalog.jsonb_typeof(p_payload->'description') <> 'string'
    or pg_catalog.jsonb_typeof(p_payload->'roster') <> 'array'
    or pg_catalog.jsonb_typeof(p_payload->'staff') <> 'array'
    or pg_catalog.length(pg_catalog.btrim(p_payload->>'name')) not between 1 and 120
    or pg_catalog.length(pg_catalog.btrim(p_payload->>'slug')) not between 1 and 120
    or (p_payload->>'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or p_payload->>'category' not in ('senior','youth')
    or pg_catalog.length(p_payload->>'seasonLabel') > 40
    or pg_catalog.length(p_payload->>'description') > 1200
    or pg_catalog.jsonb_array_length(p_payload->'roster') > 100
    or pg_catalog.jsonb_array_length(p_payload->'staff') > 30
  then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_payload');
  end if;

  for v_member in select value from pg_catalog.jsonb_array_elements(p_payload->'roster')
  loop
    if pg_catalog.jsonb_typeof(v_member) <> 'object'
      or not (v_member ?& array['name','jerseyNumber','role']::text[])
      or exists (select 1 from pg_catalog.jsonb_object_keys(v_member) supplied(key)
        where supplied.key <> all (array['name','jerseyNumber','role']::text[]))
      or pg_catalog.jsonb_typeof(v_member->'name') <> 'string'
      or pg_catalog.length(pg_catalog.btrim(v_member->>'name')) not between 1 and 120
      or pg_catalog.jsonb_typeof(v_member->'role') <> 'string'
      or pg_catalog.length(v_member->>'role') > 120
      or not (pg_catalog.jsonb_typeof(v_member->'jerseyNumber') = 'null'
        or (pg_catalog.jsonb_typeof(v_member->'jerseyNumber') = 'number'
          and (v_member->>'jerseyNumber')::numeric between 0 and 99
          and trunc((v_member->>'jerseyNumber')::numeric) = (v_member->>'jerseyNumber')::numeric))
    then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_roster');
    end if;
  end loop;

  for v_staff in select value from pg_catalog.jsonb_array_elements(p_payload->'staff')
  loop
    if pg_catalog.jsonb_typeof(v_staff) <> 'object'
      or not (v_staff ?& array['name','role']::text[])
      or exists (select 1 from pg_catalog.jsonb_object_keys(v_staff) supplied(key)
        where supplied.key <> all (array['name','role']::text[]))
      or pg_catalog.jsonb_typeof(v_staff->'name') <> 'string'
      or pg_catalog.length(pg_catalog.btrim(v_staff->>'name')) not between 1 and 120
      or pg_catalog.jsonb_typeof(v_staff->'role') <> 'string'
      or pg_catalog.length(pg_catalog.btrim(v_staff->>'role')) not between 1 and 120
    then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'invalid_staff');
    end if;
  end loop;

  if pg_catalog.exists(select 1 from pg_catalog.jsonb_array_elements(p_payload->'roster') item
    group by item->>'jerseyNumber' having item->>'jerseyNumber' is not null and count(*) > 1)
  then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'duplicate_jersey');
  end if;

  if pg_catalog.btrim(p_payload->>'seasonLabel') <> '' then
    select s.id into v_season_id from public.seasons s
    where s.label = pg_catalog.btrim(p_payload->>'seasonLabel');
    if v_season_id is null then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'season_not_found');
    end if;
  end if;

  if exists (
    select 1 from public.teams t
    where t.slug = p_payload->>'slug'
      and t.season_id is not distinct from v_season_id
      and (p_team_id is null or t.id <> p_team_id)
  ) then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'slug_taken');
  end if;

  if p_team_id is null then
    insert into public.teams (
      name, slug, category, season_id, description,
      is_published, display_order, created_by, updated_by, updated_at
    ) values (
      pg_catalog.btrim(p_payload->>'name'),
      p_payload->>'slug',
      p_payload->>'category',
      v_season_id,
      nullif(pg_catalog.btrim(p_payload->>'description'), ''),
      false, 0, v_actor, v_actor, v_now
    ) returning * into v_team;
    v_action := 'create';
  else
    select * into v_team from public.teams t
    where t.id = p_team_id for update;

    if not found or v_team.is_published then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'not_editable');
    end if;
    if p_expected_updated_at is null or v_team.updated_at is distinct from p_expected_updated_at then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'conflict');
    end if;

    update public.teams set
      name = pg_catalog.btrim(p_payload->>'name'),
      slug = p_payload->>'slug',
      category = p_payload->>'category',
      season_id = v_season_id,
      description = nullif(pg_catalog.btrim(p_payload->>'description'), ''),
      updated_by = v_actor,
      updated_at = v_now
    where id = p_team_id
    returning * into v_team;
    v_action := 'update';
  end if;

  delete from public.team_members where team_id = v_team.id;
  delete from public.team_staff where team_id = v_team.id;

  for v_member in select value from pg_catalog.jsonb_array_elements(p_payload->'roster')
  loop
    insert into public.team_members (
      team_id, name, jersey_number, position, is_published, display_order
    ) values (
      v_team.id,
      pg_catalog.btrim(v_member->>'name'),
      case when pg_catalog.jsonb_typeof(v_member->'jerseyNumber') = 'number'
        then (v_member->>'jerseyNumber')::smallint else null end,
      nullif(pg_catalog.btrim(v_member->>'role'), ''),
      false, v_index
    );
    v_index := v_index + 1;
  end loop;

  v_index := 0;
  for v_staff in select value from pg_catalog.jsonb_array_elements(p_payload->'staff')
  loop
    insert into public.team_staff (
      team_id, name, role_label, is_published, display_order
    ) values (
      v_team.id,
      pg_catalog.btrim(v_staff->>'name'),
      pg_catalog.btrim(v_staff->>'role'),
      false, v_index
    );
    v_index := v_index + 1;
  end loop;

  insert into public.editorial_audit_log (
    actor_id, actor_role, action, entity_type, entity_id, summary
  ) values (
    v_actor, v_role, v_action, 'team', v_team.id::text,
    pg_catalog.jsonb_build_object(
      'name', v_team.name,
      'slug', v_team.slug,
      'rosterCount', pg_catalog.jsonb_array_length(p_payload->'roster'),
      'staffCount', pg_catalog.jsonb_array_length(p_payload->'staff')
    )
  );

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'teamId', v_team.id,
    'updatedAt', v_team.updated_at
  );
end;
$function$;

revoke all on function private.team_editorial_command(text, uuid, timestamptz, jsonb)
  from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.team_editorial_command(text, uuid, timestamptz, jsonb)
  to authenticated;

create or replace function public.team_editorial_command(
  p_action text,
  p_team_id uuid default null,
  p_expected_updated_at timestamptz default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.team_editorial_command(p_action, p_team_id, p_expected_updated_at, p_payload);
$function$;

revoke all on function public.team_editorial_command(text, uuid, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.team_editorial_command(text, uuid, timestamptz, jsonb)
  to authenticated;
comment on function private.team_editorial_command(text, uuid, timestamptz, jsonb)
  is 'Private transactional team draft writer. Public wrapper is SECURITY INVOKER; this function checks active editorial role and writes aggregate team, roster, staff and audit atomically.';
