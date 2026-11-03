-- Saca las funciones auxiliares de la API pública.
-- Las políticas RLS las siguen usando, pero ya no se pueden llamar por /rest/v1/rpc.
create schema if not exists private;
grant usage on schema private to authenticated;

drop function if exists public.student_center(uuid);

alter function public.my_role() set schema private;
alter function public.my_center() set schema private;
alter function public.my_company() set schema private;
alter function public.offer_company(uuid) set schema private;
alter function public.applied_to_my_company(uuid) set schema private;
alter function public.i_applied(uuid) set schema private;
alter function public.approved_for_me(uuid) set schema private;
alter function public.can_see_application(uuid) set schema private;

-- Todas las funciones deben encontrar los auxiliares en su nuevo sitio.
alter function private.applied_to_my_company(uuid) set search_path = public, private;
alter function private.approved_for_me(uuid) set search_path = public, private;
alter function private.can_see_application(uuid) set search_path = public, private;
alter function public.review_offer(uuid, boolean, text) set search_path = public, private;
alter function public.apply_to_offer(uuid) set search_path = public, private;
alter function public.set_application_status(uuid, text) set search_path = public, private;
alter function public.validate_application(uuid, boolean, text, jsonb) set search_path = public, private;
alter function public.sign_agreement(uuid, text) set search_path = public, private;
alter function public.mark_qbid_exported(uuid, text) set search_path = public, private;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
