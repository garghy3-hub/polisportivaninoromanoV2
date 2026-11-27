-- Guard aggregate team content against draft edits while queued or approved.
create or replace function private.guard_team_editorial_content()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if old.editorial_status in ('in-review','approved','published') then
    -- Status/publication metadata can transition, but content must remain identical.
    if (to_jsonb(new)-'editorial_status'-'is_published'-'updated_at'-'updated_by')
       is distinct from
       (to_jsonb(old)-'editorial_status'-'is_published'-'updated_at'-'updated_by') then
      raise exception 'team_locked_for_editorial_review' using errcode='42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_team_editorial_content() from public,anon,authenticated;
drop trigger if exists team_editorial_content_guard on public.teams;
create trigger team_editorial_content_guard before update on public.teams
for each row execute function private.guard_team_editorial_content();

-- Child rows may only have their publication flag toggled by the workflow RPC
-- while the parent is queued, approved, or published. JSON row comparison avoids
-- table-specific record-field resolution errors.
create or replace function private.guard_team_children_editorial()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_team_id uuid; v_status text; v_transition boolean;
begin
  if tg_op='DELETE' then v_team_id:=old.team_id; else v_team_id:=new.team_id; end if;
  select editorial_status into v_status from public.teams where id=v_team_id;
  if v_status in ('in-review','approved','published') then
    v_transition := tg_op='UPDATE'
      and (to_jsonb(new)-'is_published'-'updated_at') is not distinct from
          (to_jsonb(old)-'is_published'-'updated_at')
      and new.is_published is distinct from old.is_published;
    if not v_transition then
      raise exception 'team_children_locked_for_editorial_review' using errcode='42501';
    end if;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
revoke all on function private.guard_team_children_editorial() from public,anon,authenticated;
drop trigger if exists team_members_editorial_guard on public.team_members;
create trigger team_members_editorial_guard before insert or update or delete on public.team_members
for each row execute function private.guard_team_children_editorial();
drop trigger if exists team_staff_editorial_guard on public.team_staff;
create trigger team_staff_editorial_guard before insert or update or delete on public.team_staff
for each row execute function private.guard_team_children_editorial();
