-- Team editorial review and publication workflow.
alter table public.teams
  add column if not exists editorial_status text not null default 'draft'
  check (editorial_status in ('draft','in-review','approved','published','rejected'));

create or replace function private.team_editorial_command(
  p_action text, p_team_id uuid default null,
  p_expected_updated_at timestamptz default null, p_payload jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_team public.teams%rowtype;
  v_now timestamptz := clock_timestamp();
  v_note text := nullif(btrim(coalesce(p_payload->>'note','')), '');
  v_status text;
begin
  if v_actor is null then return jsonb_build_object('ok',false,'code','unauthenticated'); end if;
  select role into v_role from public.admin_users where user_id=v_actor and is_active;
  if v_role is null then return jsonb_build_object('ok',false,'code','forbidden'); end if;
  if p_action not in ('save_draft','submit','approve','reject','publish','unpublish') then
    return jsonb_build_object('ok',false,'code','invalid_action');
  end if;
  if p_team_id is null then return jsonb_build_object('ok',false,'code','team_required'); end if;
  select * into v_team from public.teams where id=p_team_id for update;
  if not found then return jsonb_build_object('ok',false,'code','not_found'); end if;
  if p_expected_updated_at is null or v_team.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok',false,'code','conflict');
  end if;

  if p_action='submit' then
    if v_role not in ('editor','publisher','administrator') or v_team.is_published or v_team.editorial_status not in ('draft','rejected') then
      return jsonb_build_object('ok',false,'code','invalid_transition');
    end if;
    update public.teams set editorial_status='in-review',updated_at=v_now,updated_by=v_actor where id=p_team_id;
  elsif p_action='approve' then
    if v_role not in ('publisher','administrator') or v_team.editorial_status<>'in-review' or v_team.is_published then
      return jsonb_build_object('ok',false,'code','invalid_transition');
    end if;
    update public.teams set editorial_status='approved',updated_at=v_now,updated_by=v_actor where id=p_team_id;
  elsif p_action='reject' then
    if v_role not in ('publisher','administrator') or v_team.editorial_status<>'in-review' or v_team.is_published or length(coalesce(v_note,'')) not between 1 and 1000 then
      return jsonb_build_object('ok',false,'code','invalid_transition');
    end if;
    update public.teams set editorial_status='rejected',updated_at=v_now,updated_by=v_actor where id=p_team_id;
  elsif p_action='publish' then
    if v_role not in ('publisher','administrator') or v_team.editorial_status<>'approved' or v_team.is_published then
      return jsonb_build_object('ok',false,'code','invalid_transition');
    end if;
    update public.teams set is_published=true,editorial_status='published',updated_at=v_now,updated_by=v_actor where id=p_team_id;
    update public.team_members set is_published=true,updated_at=v_now where team_id=p_team_id;
    update public.team_staff set is_published=true,updated_at=v_now where team_id=p_team_id;
  elsif p_action='unpublish' then
    if v_role not in ('publisher','administrator') or not v_team.is_published then
      return jsonb_build_object('ok',false,'code','invalid_transition');
    end if;
    update public.teams set is_published=false,editorial_status='approved',updated_at=v_now,updated_by=v_actor where id=p_team_id;
    update public.team_members set is_published=false,updated_at=v_now where team_id=p_team_id;
    update public.team_staff set is_published=false,updated_at=v_now where team_id=p_team_id;
  else
    return jsonb_build_object('ok',false,'code','save_draft_must_use_existing_validation');
  end if;

  insert into public.editorial_audit_log(actor_id,actor_role,action,entity_type,entity_id,summary)
  values(v_actor,v_role,p_action,'team',p_team_id::text,jsonb_build_object('from',v_team.editorial_status,'to',
    case p_action when 'submit' then 'in-review' when 'approve' then 'approved' when 'reject' then 'rejected' when 'publish' then 'published' else 'approved' end,
    'note',v_note));
  select * into v_team from public.teams where id=p_team_id;
  return jsonb_build_object('ok',true,'teamId',v_team.id,'updatedAt',v_team.updated_at,'status',v_team.editorial_status);
end $$;

-- Existing draft-saving action remains implemented in the public wrapper migration.
-- This replacement delegates non-save actions to a separate workflow command to avoid
-- duplicating the validated aggregate-write path.
create or replace function private.team_editorial_workflow_command(
 p_action text,p_team_id uuid,p_expected_updated_at timestamptz,p_payload jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path=''
as $$ begin return private.team_editorial_command(p_action,p_team_id,p_expected_updated_at,p_payload); end $$;
