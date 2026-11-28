-- Keep the privileged implementation outside the exposed Data API schema.
-- The public RPC is SECURITY INVOKER and delegates to a role-checking private definer.

alter function public.news_editorial_command(text, uuid, uuid, integer, jsonb)
  set schema private;

revoke all on function private.news_editorial_command(text, uuid, uuid, integer, jsonb)
  from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.news_editorial_command(text, uuid, uuid, integer, jsonb)
  to authenticated;

create or replace function public.news_editorial_command(
  p_action text,
  p_article_id uuid default null,
  p_revision_id uuid default null,
  p_expected_version integer default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.news_editorial_command(
    p_action, p_article_id, p_revision_id, p_expected_version, p_payload
  );
$function$;

revoke all on function public.news_editorial_command(text, uuid, uuid, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.news_editorial_command(text, uuid, uuid, integer, jsonb)
  to authenticated;

comment on function private.news_editorial_command(text, uuid, uuid, integer, jsonb)
  is 'Private SECURITY DEFINER implementation. Callable only through the public SECURITY INVOKER RPC wrapper after authenticated role checks.';
