-- Convenia · esquema inicial
-- Complemento de qBID: buscar empresa, validar y cerrar el convenio.
-- Las horas y el seguimiento oficial se registran en qBID, no aquí.
-- Minimización de datos: sin DNI, sin fotos, sin vacunas, sin certificados.


-- ---------- Tablas ----------

create table public.centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  region text default 'Catalunya',
  student_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'past_due', 'canceled')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Código de invitación del personal del centro. Sin acceso desde la app.
create table public.center_secrets (
  center_id uuid primary key references public.centers on delete cascade,
  staff_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8))
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cif text,
  sector text,
  city text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('alumno', 'empresa', 'centro')),
  full_name text not null,
  center_id uuid references public.centers on delete set null,
  company_id uuid references public.companies on delete set null,
  ciclo text,
  curso text,
  city text,
  skills text[] not null default '{}',
  is_minor boolean not null default false,
  guardian_name text,
  created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  title text not null,
  department text,
  city text,
  ciclo text not null,
  modality text not null default 'Prácticas' check (modality in ('Prácticas', 'Dual')),
  hours int not null default 515 check (hours > 0),
  vacancies int not null default 1 check (vacancies > 0),
  start_date date,
  stipend int not null default 0 check (stipend >= 0),
  tasks text[] not null default '{}',
  requirements text[] not null default '{}',
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cada centro aprueba la oferta antes de que sus alumnos puedan inscribirse.
create table public.offer_reviews (
  offer_id uuid not null references public.offers on delete cascade,
  center_id uuid not null references public.centers on delete cascade,
  approved boolean not null,
  reason text,
  reviewed_by uuid references public.profiles on delete set null,
  reviewed_at timestamptz not null default now(),
  primary key (offer_id, center_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers on delete cascade,
  student_id uuid not null references public.profiles on delete cascade,
  status text not null default 'enviada'
    check (status in ('enviada', 'preseleccionada', 'entrevista', 'seleccionada', 'rechazada')),
  validation text not null default 'na'
    check (validation in ('na', 'pendiente', 'aprobada', 'rechazada')),
  deny_reason text,
  checks jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offer_id, student_id)
);

create table public.agreements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications on delete cascade,
  code text not null unique,
  company_signer text,
  company_signed_at timestamptz,
  center_signer text,
  center_signed_at timestamptz,
  student_signer text,
  student_signed_at timestamptz,
  qbid_ref text,
  qbid_exported_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.profiles (center_id);
create index on public.profiles (company_id);
create index on public.offers (company_id);
create index on public.offers (ciclo) where is_open;
create index on public.applications (student_id);
create index on public.applications (offer_id);

-- ---------- Helpers ----------

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function public.my_center() returns uuid
language sql stable security definer set search_path = public as
$$ select center_id from profiles where id = auth.uid() $$;

create or replace function public.my_company() returns uuid
language sql stable security definer set search_path = public as
$$ select company_id from profiles where id = auth.uid() $$;

-- Funciones "security definer" para que las políticas no se llamen entre sí en bucle.
create or replace function public.student_center(p_student uuid) returns uuid
language sql stable security definer set search_path = public as
$$ select center_id from profiles where id = p_student $$;

create or replace function public.offer_company(p_offer uuid) returns uuid
language sql stable security definer set search_path = public as
$$ select company_id from offers where id = p_offer $$;

create or replace function public.applied_to_my_company(p_student uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from applications a join offers o on o.id = a.offer_id
                  where a.student_id = p_student and o.company_id = my_company()) $$;

create or replace function public.i_applied(p_offer uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from applications where offer_id = p_offer and student_id = auth.uid()) $$;

create or replace function public.approved_for_me(p_offer uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from offer_reviews where offer_id = p_offer and center_id = my_center() and approved) $$;

create or replace function public.can_see_application(p_app uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (
     select 1 from applications a join offers o on o.id = a.offer_id
     join profiles s on s.id = a.student_id
     where a.id = p_app and (
       a.student_id = auth.uid()
       or o.company_id = my_company()
       or (my_role() = 'centro' and s.center_id = my_center())
     )) $$;

-- ---------- RLS ----------

alter table public.centers enable row level security;
alter table public.center_secrets enable row level security;
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.offers enable row level security;
alter table public.offer_reviews enable row level security;
alter table public.applications enable row level security;
alter table public.agreements enable row level security;

-- center_secrets: sin políticas = nadie lo lee desde la app.

create policy centers_select on public.centers for select to authenticated
  using (id = my_center());

create policy companies_select on public.companies for select to authenticated
  using (true);
create policy companies_update on public.companies for update to authenticated
  using (id = my_company()) with check (id = my_company());

create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or (my_role() = 'centro' and center_id = my_center())
    or (my_role() = 'empresa' and applied_to_my_company(id))
  );

-- Solo campos seguros. Rol, centro y empresa se cambian por RPC.
revoke update on public.profiles from authenticated;
grant update (full_name, ciclo, curso, city, skills, is_minor, guardian_name)
  on public.profiles to authenticated;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy offers_select on public.offers for select to authenticated
  using (
    company_id = my_company()
    or my_role() = 'centro'
    or (my_role() = 'alumno' and is_open and approved_for_me(id))
    or i_applied(id)
  );
create policy offers_insert on public.offers for insert to authenticated
  with check (my_role() = 'empresa' and company_id = my_company());
create policy offers_update on public.offers for update to authenticated
  using (company_id = my_company()) with check (company_id = my_company());

create policy reviews_select on public.offer_reviews for select to authenticated
  using (center_id = my_center() or offer_company(offer_id) = my_company());

create policy applications_select on public.applications for select to authenticated
  using (can_see_application(id));

create policy agreements_select on public.agreements for select to authenticated
  using (can_see_application(application_id));

-- ---------- Alta (onboarding) ----------

create or replace function public.onboard_student(p_code text, p_full_name text, p_ciclo text, p_curso text, p_is_minor boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_center uuid;
begin
  select id into v_center from centers where student_code = upper(trim(p_code));
  if v_center is null then raise exception 'Código de centro no válido'; end if;
  insert into profiles (id, role, full_name, center_id, ciclo, curso, is_minor)
  values (auth.uid(), 'alumno', p_full_name, v_center, p_ciclo, p_curso, coalesce(p_is_minor, false));
end $$;

create or replace function public.onboard_company(p_full_name text, p_company text, p_cif text, p_city text, p_sector text)
returns void language plpgsql security definer set search_path = public as $$
declare v_company uuid;
begin
  insert into companies (name, cif, city, sector) values (p_company, upper(nullif(trim(p_cif), '')), p_city, p_sector)
  returning id into v_company;
  insert into profiles (id, role, full_name, company_id, city)
  values (auth.uid(), 'empresa', p_full_name, v_company, p_city);
end $$;

create or replace function public.onboard_center_staff(p_code text, p_full_name text)
returns void language plpgsql security definer set search_path = public as $$
declare v_center uuid;
begin
  select center_id into v_center from center_secrets where staff_code = upper(trim(p_code));
  if v_center is null then raise exception 'Código de personal no válido'; end if;
  insert into profiles (id, role, full_name, center_id) values (auth.uid(), 'centro', p_full_name, v_center);
end $$;

-- ---------- Flujo ----------

-- 1. El centro aprueba o rechaza una oferta para sus alumnos.
create or replace function public.review_offer(p_offer uuid, p_approved boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if my_role() is distinct from 'centro' then raise exception 'Solo el centro puede revisar ofertas'; end if;
  if not p_approved and coalesce(trim(p_reason), '') = '' then raise exception 'Indica un motivo'; end if;
  insert into offer_reviews (offer_id, center_id, approved, reason, reviewed_by)
  values (p_offer, my_center(), p_approved, p_reason, auth.uid())
  on conflict (offer_id, center_id) do update
    set approved = excluded.approved, reason = excluded.reason,
        reviewed_by = excluded.reviewed_by, reviewed_at = now();
end $$;

-- 2. El alumno se inscribe (solo en ofertas aprobadas por su centro).
create or replace function public.apply_to_offer(p_offer uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if my_role() is distinct from 'alumno' then raise exception 'Solo alumnos'; end if;
  if not exists (
    select 1 from offers o join offer_reviews r on r.offer_id = o.id
    where o.id = p_offer and o.is_open and r.center_id = my_center() and r.approved
  ) then raise exception 'Tu centro aún no ha aprobado esta oferta'; end if;
  insert into applications (offer_id, student_id) values (p_offer, auth.uid()) returning id into v_id;
  return v_id;
end $$;

-- 3. La empresa mueve la candidatura. Al seleccionar, pasa a validación del centro.
create or replace function public.set_application_status(p_app uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from applications a join offers o on o.id = a.offer_id
    where a.id = p_app and o.company_id = my_company() and a.validation <> 'aprobada'
  ) then raise exception 'Sin permiso o ya validada por el centro'; end if;
  update applications set
    status = p_status,
    validation = case when p_status = 'seleccionada' and validation = 'na' then 'pendiente' else validation end,
    updated_at = now()
  where id = p_app;
end $$;

-- 4. El centro valida (con comprobaciones manuales) o no valida (con motivo).
--    Validar crea el convenio. El estado de pago NO bloquea este paso.
create or replace function public.validate_application(p_app uuid, p_ok boolean, p_reason text, p_checks jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_agreement uuid;
begin
  if my_role() is distinct from 'centro' or not exists (
    select 1 from applications a join profiles p on p.id = a.student_id
    where a.id = p_app and p.center_id = my_center() and a.validation = 'pendiente'
  ) then raise exception 'Sin permiso o ya validada'; end if;

  if not p_ok then
    if coalesce(trim(p_reason), '') = '' then raise exception 'Indica un motivo'; end if;
    update applications set validation = 'rechazada', deny_reason = p_reason, updated_at = now() where id = p_app;
    return null;
  end if;

  if not coalesce((p_checks->>'seguro')::boolean, false)
     or not coalesce((p_checks->>'seguridad_social')::boolean, false) then
    raise exception 'Confirma el seguro y el alta en la Seguridad Social';
  end if;

  update applications set validation = 'aprobada', checks = p_checks, updated_at = now() where id = p_app;
  insert into agreements (application_id, code)
  values (p_app, 'CNV-' || to_char(now(), 'YYYY') || '-' || upper(substr(md5(p_app::text), 1, 6)))
  returning id into v_agreement;
  return v_agreement;
end $$;

-- 5. Firma en orden: empresa, centro, alumno (o su tutor legal si es menor).
create or replace function public.sign_agreement(p_agreement uuid, p_signer text)
returns void language plpgsql security definer set search_path = public as $$
declare g agreements; a applications; o offers; s profiles;
begin
  select * into g from agreements where id = p_agreement;
  select * into a from applications where id = g.application_id;
  select * into o from offers where id = a.offer_id;
  select * into s from profiles where id = a.student_id;
  if g.id is null then raise exception 'Convenio no encontrado'; end if;
  if coalesce(trim(p_signer), '') = '' then raise exception 'Escribe el nombre de quien firma'; end if;

  if g.company_signed_at is null then
    if o.company_id is distinct from my_company() then raise exception 'Primero firma la empresa'; end if;
    update agreements set company_signer = p_signer, company_signed_at = now() where id = g.id;
  elsif g.center_signed_at is null then
    if my_role() is distinct from 'centro' or s.center_id is distinct from my_center() then raise exception 'Ahora firma el centro'; end if;
    update agreements set center_signer = p_signer, center_signed_at = now() where id = g.id;
  elsif g.student_signed_at is null then
    if a.student_id is distinct from auth.uid() then raise exception 'Ahora firma el alumno'; end if;
    update agreements set student_signer = p_signer, student_signed_at = now() where id = g.id;
  else
    raise exception 'El convenio ya está firmado';
  end if;
end $$;

-- 6. El centro marca el convenio como pasado a qBID.
create or replace function public.mark_qbid_exported(p_agreement uuid, p_ref text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if my_role() is distinct from 'centro' then raise exception 'Solo el centro'; end if;
  update agreements g set qbid_ref = p_ref, qbid_exported_at = now()
  from applications a join profiles p on p.id = a.student_id
  where g.id = p_agreement and a.id = g.application_id and p.center_id = my_center()
    and g.student_signed_at is not null;
  if not found then raise exception 'El convenio no está firmado o no es de tu centro'; end if;
end $$;

-- Borrar cuenta desde la app (obligatorio en la App Store).
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  delete from auth.users where id = auth.uid();
end $$;

-- Solo usuarios con sesión pueden llamar a las funciones.
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
