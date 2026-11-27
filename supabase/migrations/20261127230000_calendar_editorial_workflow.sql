-- Shared calendar draft persistence and editorial workflow.
-- Direct browser writes are revoked; authenticated mutations go through atomic RPCs.

alter table public.events
  add column if not exists editorial_status text not null default 'draft'
    check (editorial_status in ('draft','in-review','approved','published','rejected')),
  add column if not exists review_note text check (review_note is null or length(review_note) <= 1000),
  add column if not exists reviewer_id uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists published_at timestamptz;

update public.events
set editorial_status = 'published', published_at = coalesce(published_at, updated_at)
where is_published and editorial_status <> 'published';

create index if not exists events_editorial_queue_idx on public.events (editorial_status, submitted_at desc);
create index if not exists events_public_date_idx on public.events (is_published, starts_at);

revoke insert, update, delete on public.events from anon, authenticated;

create or replace function private.calendar_editorial_command(
  p_action text, p_event_id uuid default null, p_expected_updated_at timestamptz default null,
  p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_event public.events%rowtype;
  v_season_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if v_actor is null then return pg_catalog.jsonb_build_object('ok',false,'code','unauthenticated'); end if;
  select au.role into v_role from public.admin_users au
  where au.user_id=v_actor and au.is_active=true;
  if v_role not in ('editor','publisher','administrator') or v_role is null then
    return pg_catalog.jsonb_build_object('ok',false,'code','forbidden');
  end if;
  if p_action <> 'save_draft' then return pg_catalog.jsonb_build_object('ok',false,'code','invalid_action'); end if;

  if coalesce(pg_catalog.jsonb_typeof(p_payload),'') <> 'object'
    or not (p_payload ?& array['startsAt','homeTeam','awayTeam','eventType','roundLabel','seasonLabel','venue','competition','status','homeScore','awayScore','notes']::text[])
    or exists (select 1 from pg_catalog.jsonb_object_keys(p_payload) x(k)
      where k <> all(array['startsAt','homeTeam','awayTeam','eventType','roundLabel','seasonLabel','venue','competition','status','homeScore','awayScore','notes']::text[]))
    or coalesce(pg_catalog.jsonb_typeof(p_payload->'startsAt'),'') <> 'string'
    or coalesce(pg_catalog.jsonb_typeof(p_payload->'homeTeam'),'') <> 'string'
    or coalesce(pg_catalog.jsonb_typeof(p_payload->'awayTeam'),'') <> 'string'
    or coalesce(pg_catalog.jsonb_typeof(p_payload->'eventType'),'') <> 'string'
    or coalesce(pg_catalog.jsonb_typeof(p_payload->'roundLabel'),'') <> 'string'
    or coalesce(pg_catalog.jsonb_typeof(p_payload->'seasonLabel'),'') <> 'string'
    or coalesce(pg_catalog.jsonb_typeof(p_payload->'venue'),'') <> 'string'
    or coalesce(pg_catalog.jsonb_typeof(p_payload->'competition'),'') <> 'string'
    or coalesce(pg_catalog.jsonb_typeof(p_payload->'status'),'') <> 'string'
    or coalesce(pg_catalog.jsonb_typeof(p_payload->'notes'),'') <> 'string'
    or coalesce(pg_catalog.jsonb_typeof(p_payload->'homeScore'),'') not in ('null','number')
    or coalesce(pg_catalog.jsonb_typeof(p_payload->'awayScore'),'') not in ('null','number')
    or pg_catalog.length(pg_catalog.btrim(p_payload->>'homeTeam')) not between 1 and 120
    or pg_catalog.length(pg_catalog.btrim(p_payload->>'awayTeam')) not between 1 and 120
    or pg_catalog.lower(pg_catalog.btrim(p_payload->>'homeTeam'))=pg_catalog.lower(pg_catalog.btrim(p_payload->>'awayTeam'))
    or p_payload->>'eventType' not in ('match','training','club-event','other')
    or p_payload->>'status' not in ('scheduled','postponed','cancelled','completed')
    or pg_catalog.length(p_payload->>'roundLabel')>80
    or pg_catalog.length(p_payload->>'seasonLabel')>40
    or pg_catalog.length(p_payload->>'venue')>160
    or pg_catalog.length(p_payload->>'competition')>120
    or pg_catalog.length(p_payload->>'notes')>1000
  then return pg_catalog.jsonb_build_object('ok',false,'code','invalid_payload'); end if;

  if ((p_payload->'homeScore'='null'::jsonb) <> (p_payload->'awayScore'='null'::jsonb))
    or (p_payload->>'status'='completed' and p_payload->>'eventType'='match'
      and (p_payload->'homeScore'='null'::jsonb or p_payload->'awayScore'='null'::jsonb))
    or (p_payload->>'status'<>'completed'
      and (p_payload->'homeScore'<>'null'::jsonb or p_payload->'awayScore'<>'null'::jsonb))
    or (p_payload->'homeScore'<>'null'::jsonb and (
      (p_payload->>'homeScore')::numeric<0 or (p_payload->>'homeScore')::numeric>2147483647
      or pg_catalog.trunc((p_payload->>'homeScore')::numeric)<>(p_payload->>'homeScore')::numeric))
    or (p_payload->'awayScore'<>'null'::jsonb and (
      (p_payload->>'awayScore')::numeric<0 or (p_payload->>'awayScore')::numeric>2147483647
      or pg_catalog.trunc((p_payload->>'awayScore')::numeric)<>(p_payload->>'awayScore')::numeric))
  then return pg_catalog.jsonb_build_object('ok',false,'code','invalid_score'); end if;

  if (p_payload->>'startsAt') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{1,9})?(Z|[+-][0-9]{2}:[0-9]{2})
  exception when others then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_date');
  end;

  if pg_catalog.btrim(p_payload->>'seasonLabel')<>'' then
    select s.id into v_season_id from public.seasons s where s.label=pg_catalog.btrim(p_payload->>'seasonLabel');
    if v_season_id is null then return pg_catalog.jsonb_build_object('ok',false,'code','season_not_found'); end if;
  end if;

  if p_event_id is null then
    insert into public.events(season_id,event_type,round_label,starts_at,home_team,away_team,venue,competition,status,home_score,away_score,notes,is_published,display_order,created_by,updated_by,updated_at)
    values(v_season_id,p_payload->>'eventType',nullif(pg_catalog.btrim(p_payload->>'roundLabel'),''),(p_payload->>'startsAt')::timestamptz,
      pg_catalog.btrim(p_payload->>'homeTeam'),pg_catalog.btrim(p_payload->>'awayTeam'),
      nullif(pg_catalog.btrim(p_payload->>'venue'),''),nullif(pg_catalog.btrim(p_payload->>'competition'),''),
      p_payload->>'status',
      case when p_payload->'homeScore'='null'::jsonb then null else (p_payload->>'homeScore')::integer end,
      case when p_payload->'awayScore'='null'::jsonb then null else (p_payload->>'awayScore')::integer end,
      nullif(pg_catalog.btrim(p_payload->>'notes'),''),false,0,v_actor,v_actor,v_now)
    returning * into v_event;
    insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
    values(v_actor,v_role,'create','event',v_event.id::text,
      pg_catalog.jsonb_build_object('homeTeam',v_event.home_team,'awayTeam',v_event.away_team,'startsAt',v_event.starts_at));
  else
    select * into v_event from public.events where id=p_event_id for update;
    if not found or v_event.is_published or v_event.editorial_status not in ('draft','rejected') then
      return pg_catalog.jsonb_build_object('ok',false,'code','not_editable');
    end if;
    if p_expected_updated_at is null or v_event.updated_at is distinct from p_expected_updated_at then
      return pg_catalog.jsonb_build_object('ok',false,'code','conflict');
    end if;
    update public.events set
      season_id=v_season_id,event_type=p_payload->>'eventType',
      round_label=nullif(pg_catalog.btrim(p_payload->>'roundLabel'),''),
      starts_at=(p_payload->>'startsAt')::timestamptz,
      home_team=pg_catalog.btrim(p_payload->>'homeTeam'),away_team=pg_catalog.btrim(p_payload->>'awayTeam'),
      venue=nullif(pg_catalog.btrim(p_payload->>'venue'),''),competition=nullif(pg_catalog.btrim(p_payload->>'competition'),''),
      status=p_payload->>'status',
      home_score=case when p_payload->'homeScore'='null'::jsonb then null else (p_payload->>'homeScore')::integer end,
      away_score=case when p_payload->'awayScore'='null'::jsonb then null else (p_payload->>'awayScore')::integer end,
      notes=nullif(pg_catalog.btrim(p_payload->>'notes'),''),updated_by=v_actor,updated_at=v_now
    where id=p_event_id returning * into v_event;
    insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
    values(v_actor,v_role,'update','event',v_event.id::text,
      pg_catalog.jsonb_build_object('homeTeam',v_event.home_team,'awayTeam',v_event.away_team,'startsAt',v_event.starts_at));
  end if;

  return pg_catalog.jsonb_build_object('ok',true,'eventId',v_event.id,'updatedAt',v_event.updated_at,'editorialStatus',v_event.editorial_status);
end;
$function$;

create or replace function private.calendar_editorial_workflow_command(
  p_action text,p_event_id uuid,p_expected_updated_at timestamptz,p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path=''
as $function$
declare
  v_actor uuid:=auth.uid();
  v_role text;
  v_event public.events%rowtype;
  v_now timestamptz:=pg_catalog.clock_timestamp();
  v_note text:=nullif(pg_catalog.btrim(coalesce(p_payload->>'note','')),'');
  v_previous text;
  v_target text;
begin
  if v_actor is null then return pg_catalog.jsonb_build_object('ok',false,'code','unauthenticated'); end if;
  select au.role into v_role from public.admin_users au where au.user_id=v_actor and au.is_active=true;
  if v_role is null or v_role not in ('editor','publisher','administrator') then return pg_catalog.jsonb_build_object('ok',false,'code','forbidden'); end if;
  if p_action not in ('submit','approve','reject','publish','unpublish') or p_event_id is null then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_action'); end if;
  if p_payload is null or pg_catalog.jsonb_typeof(p_payload)<>'object'
    or exists(select 1 from pg_catalog.jsonb_object_keys(p_payload) x(k) where k<>'note')
    or (p_action='reject' and (v_note is null or pg_catalog.length(v_note)>1000))
    or (p_action<>'reject' and v_note is not null) then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_payload'); end if;

  select * into v_event from public.events where id=p_event_id for update;
  if not found then return pg_catalog.jsonb_build_object('ok',false,'code','not_found'); end if;
  if p_expected_updated_at is null or v_event.updated_at is distinct from p_expected_updated_at then
    return pg_catalog.jsonb_build_object('ok',false,'code','conflict'); end if;
  v_previous:=v_event.editorial_status;

  if p_action='submit' then
    if v_role not in ('editor','publisher','administrator') or v_event.is_published or v_previous not in ('draft','rejected') then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='in-review';
  elsif p_action in ('approve','reject') then
    if v_role not in ('publisher','administrator') or v_previous<>'in-review' or v_event.is_published then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:=case when p_action='approve' then 'approved' else 'rejected' end;
  elsif p_action='publish' then
    if v_role not in ('publisher','administrator') or v_previous<>'approved' or v_event.is_published then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='published';
  elsif p_action='unpublish' then
    if v_role not in ('publisher','administrator') or v_previous<>'published' or not v_event.is_published then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='approved';
  end if;

  update public.events set editorial_status=v_target,is_published=(v_target='published'),
    review_note=case when p_action='reject' then v_note else null end,
    reviewer_id=case when p_action in ('approve','reject') then v_actor else reviewer_id end,
    reviewed_at=case when p_action in ('approve','reject') then v_now else reviewed_at end,
    submitted_at=case when p_action='submit' then v_now else submitted_at end,
    published_at=case when p_action='publish' then v_now when p_action='unpublish' then null else published_at end,
    updated_by=v_actor,updated_at=v_now
  where id=p_event_id returning * into v_event;

  insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
  values(v_actor,v_role,p_action,'event',p_event_id::text,
    pg_catalog.jsonb_build_object('from',v_previous,'to',v_target,'note',v_note));
  return pg_catalog.jsonb_build_object('ok',true,'eventId',p_event_id,'updatedAt',v_now,'editorialStatus',v_target);
end;
$function$;

revoke all on function private.calendar_editorial_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
revoke all on function private.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.calendar_editorial_command(text,uuid,timestamptz,jsonb) to authenticated;
grant execute on function private.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) to authenticated;

create or replace function public.calendar_editorial_command(
  p_action text,p_event_id uuid default null,p_expected_updated_at timestamptz default null,p_payload jsonb default '{}'::jsonb
) returns jsonb language sql security invoker set search_path=''
as $function$ select private.calendar_editorial_command(p_action,p_event_id,p_expected_updated_at,p_payload); $function$;
create or replace function public.calendar_editorial_workflow_command(
  p_action text,p_event_id uuid,p_expected_updated_at timestamptz,p_payload jsonb default '{}'::jsonb
) returns jsonb language sql security invoker set search_path=''
as $function$ select private.calendar_editorial_workflow_command(p_action,p_event_id,p_expected_updated_at,p_payload); $function$;

revoke all on function public.calendar_editorial_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
revoke all on function public.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.calendar_editorial_command(text,uuid,timestamptz,jsonb) to authenticated;
grant execute on function public.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) to authenticated;

comment on function private.calendar_editorial_command(text,uuid,timestamptz,jsonb)
  is 'Authenticated transactional calendar draft writer with payload validation, optimistic concurrency and audit logging.';
comment on function private.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb)
  is 'Calendar review and publication workflow with role checks, optimistic concurrency and audit logging.';
 then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_date');
  end if;
  begin
    perform (p_payload->>'startsAt')::timestamptz;
  exception when others then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_date');
  end;

  if pg_catalog.btrim(p_payload->>'seasonLabel')<>'' then
    select s.id into v_season_id from public.seasons s where s.label=pg_catalog.btrim(p_payload->>'seasonLabel');
    if v_season_id is null then return pg_catalog.jsonb_build_object('ok',false,'code','season_not_found'); end if;
  end if;

  if p_event_id is null then
    insert into public.events(season_id,event_type,round_label,starts_at,home_team,away_team,venue,competition,status,home_score,away_score,notes,is_published,display_order,created_by,updated_by,updated_at)
    values(v_season_id,p_payload->>'eventType',nullif(pg_catalog.btrim(p_payload->>'roundLabel'),''),(p_payload->>'startsAt')::timestamptz,
      pg_catalog.btrim(p_payload->>'homeTeam'),pg_catalog.btrim(p_payload->>'awayTeam'),
      nullif(pg_catalog.btrim(p_payload->>'venue'),''),nullif(pg_catalog.btrim(p_payload->>'competition'),''),
      p_payload->>'status',
      case when p_payload->'homeScore'='null'::jsonb then null else (p_payload->>'homeScore')::integer end,
      case when p_payload->'awayScore'='null'::jsonb then null else (p_payload->>'awayScore')::integer end,
      nullif(pg_catalog.btrim(p_payload->>'notes'),''),false,0,v_actor,v_actor,v_now)
    returning * into v_event;
    insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
    values(v_actor,v_role,'create','event',v_event.id::text,
      pg_catalog.jsonb_build_object('homeTeam',v_event.home_team,'awayTeam',v_event.away_team,'startsAt',v_event.starts_at));
  else
    select * into v_event from public.events where id=p_event_id for update;
    if not found or v_event.is_published or v_event.editorial_status not in ('draft','rejected') then
      return pg_catalog.jsonb_build_object('ok',false,'code','not_editable');
    end if;
    if p_expected_updated_at is null or v_event.updated_at is distinct from p_expected_updated_at then
      return pg_catalog.jsonb_build_object('ok',false,'code','conflict');
    end if;
    update public.events set
      season_id=v_season_id,event_type=p_payload->>'eventType',
      round_label=nullif(pg_catalog.btrim(p_payload->>'roundLabel'),''),
      starts_at=(p_payload->>'startsAt')::timestamptz,
      home_team=pg_catalog.btrim(p_payload->>'homeTeam'),away_team=pg_catalog.btrim(p_payload->>'awayTeam'),
      venue=nullif(pg_catalog.btrim(p_payload->>'venue'),''),competition=nullif(pg_catalog.btrim(p_payload->>'competition'),''),
      status=p_payload->>'status',
      home_score=case when p_payload->'homeScore'='null'::jsonb then null else (p_payload->>'homeScore')::integer end,
      away_score=case when p_payload->'awayScore'='null'::jsonb then null else (p_payload->>'awayScore')::integer end,
      notes=nullif(pg_catalog.btrim(p_payload->>'notes'),''),updated_by=v_actor,updated_at=v_now
    where id=p_event_id returning * into v_event;
    insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
    values(v_actor,v_role,'update','event',v_event.id::text,
      pg_catalog.jsonb_build_object('homeTeam',v_event.home_team,'awayTeam',v_event.away_team,'startsAt',v_event.starts_at));
  end if;

  return pg_catalog.jsonb_build_object('ok',true,'eventId',v_event.id,'updatedAt',v_event.updated_at,'editorialStatus',v_event.editorial_status);
end;
$function$;

create or replace function private.calendar_editorial_workflow_command(
  p_action text,p_event_id uuid,p_expected_updated_at timestamptz,p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path=''
as $function$
declare
  v_actor uuid:=auth.uid();
  v_role text;
  v_event public.events%rowtype;
  v_now timestamptz:=pg_catalog.clock_timestamp();
  v_note text:=nullif(pg_catalog.btrim(coalesce(p_payload->>'note','')),'');
  v_previous text;
  v_target text;
begin
  if v_actor is null then return pg_catalog.jsonb_build_object('ok',false,'code','unauthenticated'); end if;
  select au.role into v_role from public.admin_users au where au.user_id=v_actor and au.is_active=true;
  if v_role is null or v_role not in ('editor','publisher','administrator') then return pg_catalog.jsonb_build_object('ok',false,'code','forbidden'); end if;
  if p_action not in ('submit','approve','reject','publish','unpublish') or p_event_id is null then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_action'); end if;
  if p_payload is null or pg_catalog.jsonb_typeof(p_payload)<>'object'
    or exists(select 1 from pg_catalog.jsonb_object_keys(p_payload) x(k) where k<>'note')
    or (p_action='reject' and (v_note is null or pg_catalog.length(v_note)>1000))
    or (p_action<>'reject' and v_note is not null) then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_payload'); end if;

  select * into v_event from public.events where id=p_event_id for update;
  if not found then return pg_catalog.jsonb_build_object('ok',false,'code','not_found'); end if;
  if p_expected_updated_at is null or v_event.updated_at is distinct from p_expected_updated_at then
    return pg_catalog.jsonb_build_object('ok',false,'code','conflict'); end if;
  v_previous:=v_event.editorial_status;

  if p_action='submit' then
    if v_role not in ('editor','publisher','administrator') or v_event.is_published or v_previous not in ('draft','rejected') then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='in-review';
  elsif p_action in ('approve','reject') then
    if v_role not in ('publisher','administrator') or v_previous<>'in-review' or v_event.is_published then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:=case when p_action='approve' then 'approved' else 'rejected' end;
  elsif p_action='publish' then
    if v_role not in ('publisher','administrator') or v_previous<>'approved' or v_event.is_published then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='published';
  elsif p_action='unpublish' then
    if v_role not in ('publisher','administrator') or v_previous<>'published' or not v_event.is_published then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='approved';
  end if;

  update public.events set editorial_status=v_target,is_published=(v_target='published'),
    review_note=case when p_action='reject' then v_note else null end,
    reviewer_id=case when p_action in ('approve','reject') then v_actor else reviewer_id end,
    reviewed_at=case when p_action in ('approve','reject') then v_now else reviewed_at end,
    submitted_at=case when p_action='submit' then v_now else submitted_at end,
    published_at=case when p_action='publish' then v_now when p_action='unpublish' then null else published_at end,
    updated_by=v_actor,updated_at=v_now
  where id=p_event_id returning * into v_event;

  insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
  values(v_actor,v_role,p_action,'event',p_event_id::text,
    pg_catalog.jsonb_build_object('from',v_previous,'to',v_target,'note',v_note));
  return pg_catalog.jsonb_build_object('ok',true,'eventId',p_event_id,'updatedAt',v_now,'editorialStatus',v_target);
end;
$function$;

revoke all on function private.calendar_editorial_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
revoke all on function private.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.calendar_editorial_command(text,uuid,timestamptz,jsonb) to authenticated;
grant execute on function private.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) to authenticated;

create or replace function public.calendar_editorial_command(
  p_action text,p_event_id uuid default null,p_expected_updated_at timestamptz default null,p_payload jsonb default '{}'::jsonb
) returns jsonb language sql security invoker set search_path=''
as $function$ select private.calendar_editorial_command(p_action,p_event_id,p_expected_updated_at,p_payload); $function$;
create or replace function public.calendar_editorial_workflow_command(
  p_action text,p_event_id uuid,p_expected_updated_at timestamptz,p_payload jsonb default '{}'::jsonb
) returns jsonb language sql security invoker set search_path=''
as $function$ select private.calendar_editorial_workflow_command(p_action,p_event_id,p_expected_updated_at,p_payload); $function$;

revoke all on function public.calendar_editorial_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
revoke all on function public.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.calendar_editorial_command(text,uuid,timestamptz,jsonb) to authenticated;
grant execute on function public.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) to authenticated;

comment on function private.calendar_editorial_command(text,uuid,timestamptz,jsonb)
  is 'Authenticated transactional calendar draft writer with payload validation, optimistic concurrency and audit logging.';
comment on function private.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb)
  is 'Calendar review and publication workflow with role checks, optimistic concurrency and audit logging.';
 then
  exception when others then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_date');
  end;

  if pg_catalog.btrim(p_payload->>'seasonLabel')<>'' then
    select s.id into v_season_id from public.seasons s where s.label=pg_catalog.btrim(p_payload->>'seasonLabel');
    if v_season_id is null then return pg_catalog.jsonb_build_object('ok',false,'code','season_not_found'); end if;
  end if;

  if p_event_id is null then
    insert into public.events(season_id,event_type,round_label,starts_at,home_team,away_team,venue,competition,status,home_score,away_score,notes,is_published,display_order,created_by,updated_by,updated_at)
    values(v_season_id,p_payload->>'eventType',nullif(pg_catalog.btrim(p_payload->>'roundLabel'),''),(p_payload->>'startsAt')::timestamptz,
      pg_catalog.btrim(p_payload->>'homeTeam'),pg_catalog.btrim(p_payload->>'awayTeam'),
      nullif(pg_catalog.btrim(p_payload->>'venue'),''),nullif(pg_catalog.btrim(p_payload->>'competition'),''),
      p_payload->>'status',
      case when p_payload->'homeScore'='null'::jsonb then null else (p_payload->>'homeScore')::integer end,
      case when p_payload->'awayScore'='null'::jsonb then null else (p_payload->>'awayScore')::integer end,
      nullif(pg_catalog.btrim(p_payload->>'notes'),''),false,0,v_actor,v_actor,v_now)
    returning * into v_event;
    insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
    values(v_actor,v_role,'create','event',v_event.id::text,
      pg_catalog.jsonb_build_object('homeTeam',v_event.home_team,'awayTeam',v_event.away_team,'startsAt',v_event.starts_at));
  else
    select * into v_event from public.events where id=p_event_id for update;
    if not found or v_event.is_published or v_event.editorial_status not in ('draft','rejected') then
      return pg_catalog.jsonb_build_object('ok',false,'code','not_editable');
    end if;
    if p_expected_updated_at is null or v_event.updated_at is distinct from p_expected_updated_at then
      return pg_catalog.jsonb_build_object('ok',false,'code','conflict');
    end if;
    update public.events set
      season_id=v_season_id,event_type=p_payload->>'eventType',
      round_label=nullif(pg_catalog.btrim(p_payload->>'roundLabel'),''),
      starts_at=(p_payload->>'startsAt')::timestamptz,
      home_team=pg_catalog.btrim(p_payload->>'homeTeam'),away_team=pg_catalog.btrim(p_payload->>'awayTeam'),
      venue=nullif(pg_catalog.btrim(p_payload->>'venue'),''),competition=nullif(pg_catalog.btrim(p_payload->>'competition'),''),
      status=p_payload->>'status',
      home_score=case when p_payload->'homeScore'='null'::jsonb then null else (p_payload->>'homeScore')::integer end,
      away_score=case when p_payload->'awayScore'='null'::jsonb then null else (p_payload->>'awayScore')::integer end,
      notes=nullif(pg_catalog.btrim(p_payload->>'notes'),''),updated_by=v_actor,updated_at=v_now
    where id=p_event_id returning * into v_event;
    insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
    values(v_actor,v_role,'update','event',v_event.id::text,
      pg_catalog.jsonb_build_object('homeTeam',v_event.home_team,'awayTeam',v_event.away_team,'startsAt',v_event.starts_at));
  end if;

  return pg_catalog.jsonb_build_object('ok',true,'eventId',v_event.id,'updatedAt',v_event.updated_at,'editorialStatus',v_event.editorial_status);
end;
$function$;

create or replace function private.calendar_editorial_workflow_command(
  p_action text,p_event_id uuid,p_expected_updated_at timestamptz,p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path=''
as $function$
declare
  v_actor uuid:=auth.uid();
  v_role text;
  v_event public.events%rowtype;
  v_now timestamptz:=pg_catalog.clock_timestamp();
  v_note text:=nullif(pg_catalog.btrim(coalesce(p_payload->>'note','')),'');
  v_previous text;
  v_target text;
begin
  if v_actor is null then return pg_catalog.jsonb_build_object('ok',false,'code','unauthenticated'); end if;
  select au.role into v_role from public.admin_users au where au.user_id=v_actor and au.is_active=true;
  if v_role is null or v_role not in ('editor','publisher','administrator') then return pg_catalog.jsonb_build_object('ok',false,'code','forbidden'); end if;
  if p_action not in ('submit','approve','reject','publish','unpublish') or p_event_id is null then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_action'); end if;
  if p_payload is null or pg_catalog.jsonb_typeof(p_payload)<>'object'
    or exists(select 1 from pg_catalog.jsonb_object_keys(p_payload) x(k) where k<>'note')
    or (p_action='reject' and (v_note is null or pg_catalog.length(v_note)>1000))
    or (p_action<>'reject' and v_note is not null) then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_payload'); end if;

  select * into v_event from public.events where id=p_event_id for update;
  if not found then return pg_catalog.jsonb_build_object('ok',false,'code','not_found'); end if;
  if p_expected_updated_at is null or v_event.updated_at is distinct from p_expected_updated_at then
    return pg_catalog.jsonb_build_object('ok',false,'code','conflict'); end if;
  v_previous:=v_event.editorial_status;

  if p_action='submit' then
    if v_role not in ('editor','publisher','administrator') or v_event.is_published or v_previous not in ('draft','rejected') then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='in-review';
  elsif p_action in ('approve','reject') then
    if v_role not in ('publisher','administrator') or v_previous<>'in-review' or v_event.is_published then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:=case when p_action='approve' then 'approved' else 'rejected' end;
  elsif p_action='publish' then
    if v_role not in ('publisher','administrator') or v_previous<>'approved' or v_event.is_published then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='published';
  elsif p_action='unpublish' then
    if v_role not in ('publisher','administrator') or v_previous<>'published' or not v_event.is_published then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='approved';
  end if;

  update public.events set editorial_status=v_target,is_published=(v_target='published'),
    review_note=case when p_action='reject' then v_note else null end,
    reviewer_id=case when p_action in ('approve','reject') then v_actor else reviewer_id end,
    reviewed_at=case when p_action in ('approve','reject') then v_now else reviewed_at end,
    submitted_at=case when p_action='submit' then v_now else submitted_at end,
    published_at=case when p_action='publish' then v_now when p_action='unpublish' then null else published_at end,
    updated_by=v_actor,updated_at=v_now
  where id=p_event_id returning * into v_event;

  insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
  values(v_actor,v_role,p_action,'event',p_event_id::text,
    pg_catalog.jsonb_build_object('from',v_previous,'to',v_target,'note',v_note));
  return pg_catalog.jsonb_build_object('ok',true,'eventId',p_event_id,'updatedAt',v_now,'editorialStatus',v_target);
end;
$function$;

revoke all on function private.calendar_editorial_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
revoke all on function private.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.calendar_editorial_command(text,uuid,timestamptz,jsonb) to authenticated;
grant execute on function private.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) to authenticated;

create or replace function public.calendar_editorial_command(
  p_action text,p_event_id uuid default null,p_expected_updated_at timestamptz default null,p_payload jsonb default '{}'::jsonb
) returns jsonb language sql security invoker set search_path=''
as $function$ select private.calendar_editorial_command(p_action,p_event_id,p_expected_updated_at,p_payload); $function$;
create or replace function public.calendar_editorial_workflow_command(
  p_action text,p_event_id uuid,p_expected_updated_at timestamptz,p_payload jsonb default '{}'::jsonb
) returns jsonb language sql security invoker set search_path=''
as $function$ select private.calendar_editorial_workflow_command(p_action,p_event_id,p_expected_updated_at,p_payload); $function$;

revoke all on function public.calendar_editorial_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
revoke all on function public.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.calendar_editorial_command(text,uuid,timestamptz,jsonb) to authenticated;
grant execute on function public.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) to authenticated;

comment on function private.calendar_editorial_command(text,uuid,timestamptz,jsonb)
  is 'Authenticated transactional calendar draft writer with payload validation, optimistic concurrency and audit logging.';
comment on function private.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb)
  is 'Calendar review and publication workflow with role checks, optimistic concurrency and audit logging.';
 then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_date');
  end if;
  begin
    perform (p_payload->>'startsAt')::timestamptz;
  exception when others then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_date');
  end;

  if pg_catalog.btrim(p_payload->>'seasonLabel')<>'' then
    select s.id into v_season_id from public.seasons s where s.label=pg_catalog.btrim(p_payload->>'seasonLabel');
    if v_season_id is null then return pg_catalog.jsonb_build_object('ok',false,'code','season_not_found'); end if;
  end if;

  if p_event_id is null then
    insert into public.events(season_id,event_type,round_label,starts_at,home_team,away_team,venue,competition,status,home_score,away_score,notes,is_published,display_order,created_by,updated_by,updated_at)
    values(v_season_id,p_payload->>'eventType',nullif(pg_catalog.btrim(p_payload->>'roundLabel'),''),(p_payload->>'startsAt')::timestamptz,
      pg_catalog.btrim(p_payload->>'homeTeam'),pg_catalog.btrim(p_payload->>'awayTeam'),
      nullif(pg_catalog.btrim(p_payload->>'venue'),''),nullif(pg_catalog.btrim(p_payload->>'competition'),''),
      p_payload->>'status',
      case when p_payload->'homeScore'='null'::jsonb then null else (p_payload->>'homeScore')::integer end,
      case when p_payload->'awayScore'='null'::jsonb then null else (p_payload->>'awayScore')::integer end,
      nullif(pg_catalog.btrim(p_payload->>'notes'),''),false,0,v_actor,v_actor,v_now)
    returning * into v_event;
    insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
    values(v_actor,v_role,'create','event',v_event.id::text,
      pg_catalog.jsonb_build_object('homeTeam',v_event.home_team,'awayTeam',v_event.away_team,'startsAt',v_event.starts_at));
  else
    select * into v_event from public.events where id=p_event_id for update;
    if not found or v_event.is_published or v_event.editorial_status not in ('draft','rejected') then
      return pg_catalog.jsonb_build_object('ok',false,'code','not_editable');
    end if;
    if p_expected_updated_at is null or v_event.updated_at is distinct from p_expected_updated_at then
      return pg_catalog.jsonb_build_object('ok',false,'code','conflict');
    end if;
    update public.events set
      season_id=v_season_id,event_type=p_payload->>'eventType',
      round_label=nullif(pg_catalog.btrim(p_payload->>'roundLabel'),''),
      starts_at=(p_payload->>'startsAt')::timestamptz,
      home_team=pg_catalog.btrim(p_payload->>'homeTeam'),away_team=pg_catalog.btrim(p_payload->>'awayTeam'),
      venue=nullif(pg_catalog.btrim(p_payload->>'venue'),''),competition=nullif(pg_catalog.btrim(p_payload->>'competition'),''),
      status=p_payload->>'status',
      home_score=case when p_payload->'homeScore'='null'::jsonb then null else (p_payload->>'homeScore')::integer end,
      away_score=case when p_payload->'awayScore'='null'::jsonb then null else (p_payload->>'awayScore')::integer end,
      notes=nullif(pg_catalog.btrim(p_payload->>'notes'),''),updated_by=v_actor,updated_at=v_now
    where id=p_event_id returning * into v_event;
    insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
    values(v_actor,v_role,'update','event',v_event.id::text,
      pg_catalog.jsonb_build_object('homeTeam',v_event.home_team,'awayTeam',v_event.away_team,'startsAt',v_event.starts_at));
  end if;

  return pg_catalog.jsonb_build_object('ok',true,'eventId',v_event.id,'updatedAt',v_event.updated_at,'editorialStatus',v_event.editorial_status);
end;
$function$;

create or replace function private.calendar_editorial_workflow_command(
  p_action text,p_event_id uuid,p_expected_updated_at timestamptz,p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path=''
as $function$
declare
  v_actor uuid:=auth.uid();
  v_role text;
  v_event public.events%rowtype;
  v_now timestamptz:=pg_catalog.clock_timestamp();
  v_note text:=nullif(pg_catalog.btrim(coalesce(p_payload->>'note','')),'');
  v_previous text;
  v_target text;
begin
  if v_actor is null then return pg_catalog.jsonb_build_object('ok',false,'code','unauthenticated'); end if;
  select au.role into v_role from public.admin_users au where au.user_id=v_actor and au.is_active=true;
  if v_role is null or v_role not in ('editor','publisher','administrator') then return pg_catalog.jsonb_build_object('ok',false,'code','forbidden'); end if;
  if p_action not in ('submit','approve','reject','publish','unpublish') or p_event_id is null then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_action'); end if;
  if p_payload is null or pg_catalog.jsonb_typeof(p_payload)<>'object'
    or exists(select 1 from pg_catalog.jsonb_object_keys(p_payload) x(k) where k<>'note')
    or (p_action='reject' and (v_note is null or pg_catalog.length(v_note)>1000))
    or (p_action<>'reject' and v_note is not null) then
    return pg_catalog.jsonb_build_object('ok',false,'code','invalid_payload'); end if;

  select * into v_event from public.events where id=p_event_id for update;
  if not found then return pg_catalog.jsonb_build_object('ok',false,'code','not_found'); end if;
  if p_expected_updated_at is null or v_event.updated_at is distinct from p_expected_updated_at then
    return pg_catalog.jsonb_build_object('ok',false,'code','conflict'); end if;
  v_previous:=v_event.editorial_status;

  if p_action='submit' then
    if v_role not in ('editor','publisher','administrator') or v_event.is_published or v_previous not in ('draft','rejected') then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='in-review';
  elsif p_action in ('approve','reject') then
    if v_role not in ('publisher','administrator') or v_previous<>'in-review' or v_event.is_published then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:=case when p_action='approve' then 'approved' else 'rejected' end;
  elsif p_action='publish' then
    if v_role not in ('publisher','administrator') or v_previous<>'approved' or v_event.is_published then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='published';
  elsif p_action='unpublish' then
    if v_role not in ('publisher','administrator') or v_previous<>'published' or not v_event.is_published then
      return pg_catalog.jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='approved';
  end if;

  update public.events set editorial_status=v_target,is_published=(v_target='published'),
    review_note=case when p_action='reject' then v_note else null end,
    reviewer_id=case when p_action in ('approve','reject') then v_actor else reviewer_id end,
    reviewed_at=case when p_action in ('approve','reject') then v_now else reviewed_at end,
    submitted_at=case when p_action='submit' then v_now else submitted_at end,
    published_at=case when p_action='publish' then v_now when p_action='unpublish' then null else published_at end,
    updated_by=v_actor,updated_at=v_now
  where id=p_event_id returning * into v_event;

  insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
  values(v_actor,v_role,p_action,'event',p_event_id::text,
    pg_catalog.jsonb_build_object('from',v_previous,'to',v_target,'note',v_note));
  return pg_catalog.jsonb_build_object('ok',true,'eventId',p_event_id,'updatedAt',v_now,'editorialStatus',v_target);
end;
$function$;

revoke all on function private.calendar_editorial_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
revoke all on function private.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.calendar_editorial_command(text,uuid,timestamptz,jsonb) to authenticated;
grant execute on function private.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) to authenticated;

create or replace function public.calendar_editorial_command(
  p_action text,p_event_id uuid default null,p_expected_updated_at timestamptz default null,p_payload jsonb default '{}'::jsonb
) returns jsonb language sql security invoker set search_path=''
as $function$ select private.calendar_editorial_command(p_action,p_event_id,p_expected_updated_at,p_payload); $function$;
create or replace function public.calendar_editorial_workflow_command(
  p_action text,p_event_id uuid,p_expected_updated_at timestamptz,p_payload jsonb default '{}'::jsonb
) returns jsonb language sql security invoker set search_path=''
as $function$ select private.calendar_editorial_workflow_command(p_action,p_event_id,p_expected_updated_at,p_payload); $function$;

revoke all on function public.calendar_editorial_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
revoke all on function public.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.calendar_editorial_command(text,uuid,timestamptz,jsonb) to authenticated;
grant execute on function public.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb) to authenticated;

comment on function private.calendar_editorial_command(text,uuid,timestamptz,jsonb)
  is 'Authenticated transactional calendar draft writer with payload validation, optimistic concurrency and audit logging.';
comment on function private.calendar_editorial_workflow_command(text,uuid,timestamptz,jsonb)
  is 'Calendar review and publication workflow with role checks, optimistic concurrency and audit logging.';
