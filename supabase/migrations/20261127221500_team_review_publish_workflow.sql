-- Team editorial review and publication workflow.
alter table public.teams
  add column if not exists editorial_status text not null default 'draft'
  check (editorial_status in ('draft','in-review','approved','published','rejected'));

create or replace function private.team_editorial_workflow_command(
  p_action text, p_team_id uuid, p_expected_updated_at timestamptz, p_payload jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_team public.teams%rowtype;
  v_now timestamptz := clock_timestamp();
  v_note text := nullif(pg_catalog.btrim(coalesce(p_payload->>'note','')), '');
  v_target text;
begin
  if v_actor is null then return jsonb_build_object('ok',false,'code','unauthenticated'); end if;
  select role into v_role from public.admin_users where user_id=v_actor and is_active;
  if v_role is null then return jsonb_build_object('ok',false,'code','forbidden'); end if;
  if p_action not in ('submit','approve','reject','publish','unpublish') or p_team_id is null then
    return jsonb_build_object('ok',false,'code','invalid_action');
  end if;
  select * into v_team from public.teams where id=p_team_id for update;
  if not found then return jsonb_build_object('ok',false,'code','not_found'); end if;
  if p_expected_updated_at is null or v_team.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok',false,'code','conflict');
  end if;
  if p_payload is null or pg_catalog.jsonb_typeof(p_payload)<>'object'
    or exists(select 1 from pg_catalog.jsonb_object_keys(p_payload) k where k <> 'note')
    or (p_action='reject' and (v_note is null or length(v_note)>1000))
    or (p_action<>'reject' and v_note is not null) then
    return jsonb_build_object('ok',false,'code','invalid_payload');
  end if;
  if p_action='submit' then
    if v_role not in ('editor','publisher','administrator') or v_team.is_published or v_team.editorial_status not in ('draft','rejected') then return jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='in-review';
  elsif p_action='approve' then
    if v_role not in ('publisher','administrator') or v_team.editorial_status<>'in-review' or v_team.is_published then return jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='approved';
  elsif p_action='reject' then
    if v_role not in ('publisher','administrator') or v_team.editorial_status<>'in-review' or v_team.is_published then return jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='rejected';
  elsif p_action='publish' then
    if v_role not in ('publisher','administrator') or v_team.editorial_status<>'approved' or v_team.is_published then return jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='published';
    update public.team_members set is_published=true,updated_at=v_now where team_id=p_team_id;
    update public.team_staff set is_published=true,updated_at=v_now where team_id=p_team_id;
  elsif p_action='unpublish' then
    if v_role not in ('publisher','administrator') or not v_team.is_published then return jsonb_build_object('ok',false,'code','invalid_transition'); end if;
    v_target:='approved';
    update public.team_members set is_published=false,updated_at=v_now where team_id=p_team_id;
    update public.team_staff set is_published=false,updated_at=v_now where team_id=p_team_id;
  end if;
  update public.teams set editorial_status=v_target,is_published=(v_target='published'),updated_at=v_now,updated_by=v_actor where id=p_team_id;
  insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
  values(v_actor,v_role,p_action,'team',p_team_id::text,jsonb_build_object('from',v_team.editorial_status,'to',v_target,'note',v_note));
  return jsonb_build_object('ok',true,'teamId',p_team_id,'updatedAt',v_now,'status',v_target);
end $$;

revoke all on function private.team_editorial_workflow_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.team_editorial_workflow_command(text,uuid,timestamptz,jsonb) to authenticated;

create or replace function public.team_editorial_workflow_command(
  p_action text,p_team_id uuid,p_expected_updated_at timestamptz,p_payload jsonb default '{}'::jsonb
) returns jsonb language sql security invoker set search_path=''
as $$ select private.team_editorial_workflow_command(p_action,p_team_id,p_expected_updated_at,p_payload); $$;
revoke all on function public.team_editorial_workflow_command(text,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.team_editorial_workflow_command(text,uuid,timestamptz,jsonb) to authenticated;
