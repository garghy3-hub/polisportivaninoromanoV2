-- Guard aggregate team content against draft edits while queued or approved.
create or replace function private.guard_team_editorial_content()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if old.editorial_status in ('in-review','approved','published')
    and new.editorial_status is not distinct from old.editorial_status
    and (new.name is distinct from old.name or new.slug is distinct from old.slug
      or new.category is distinct from old.category or new.season_id is distinct from old.season_id
      or new.description is distinct from old.description) then
    raise exception 'team_locked_for_editorial_review' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function private.guard_team_editorial_content() from public,anon,authenticated;
drop trigger if exists team_editorial_content_guard on public.teams;
create trigger team_editorial_content_guard before update on public.teams
for each row execute function private.guard_team_editorial_content();

-- Also prevent aggregate replacement from draft save RPC from changing roster/staff
-- while the parent is in review/approved; only a publisher command may publish.
create or replace function private.guard_team_children_editorial()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_team_id uuid; v_status text;
begin
  v_team_id := coalesce(new.team_id,old.team_id);
  select editorial_status into v_status from public.teams where id=v_team_id;
  if v_status in ('in-review','approved','published') then
    raise exception 'team_children_locked_for_editorial_review' using errcode='42501';
  end if;
  return coalesce(new,old);
end $$;
revoke all on function private.guard_team_children_editorial() from public,anon,authenticated;
drop trigger if exists team_members_editorial_guard on public.team_members;
create trigger team_members_editorial_guard before insert or update or delete on public.team_members
for each row execute function private.guard_team_children_editorial();
drop trigger if exists team_staff_editorial_guard on public.team_staff;
create trigger team_staff_editorial_guard before insert or update or delete on public.team_staff
for each row execute function private.guard_team_children_editorial();

-- Publisher workflow transitions to published/unpublished affect child rows; disable
-- the child-content guard for those specific transition rows via the parent transition
-- context flag is not available, so child guard also recognizes published-state toggle.
create or replace function private.guard_team_children_editorial()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_team_id uuid; v_status text; v_transition boolean;
begin
  v_team_id := coalesce(new.team_id,old.team_id);
  select editorial_status into v_status from public.teams where id=v_team_id;
  if v_status in ('in-review','approved','published') then
    v_transition := TG_OP='UPDATE'
      and new.team_id is not distinct from old.team_id
      and new.name is not distinct from old.name
      and (TG_TABLE_NAME='team_members' and new.jersey_number is not distinct from old.jersey_number or TG_TABLE_NAME='team_staff')
      and new.is_published is distinct from old.is_published;
    if not v_transition then
      raise exception 'team_children_locked_for_editorial_review' using errcode='42501';
    end if;
  end if;
  if TG_OP='DELETE' then return old; else return new; end if;
end $$;
