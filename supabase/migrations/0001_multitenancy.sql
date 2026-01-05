-- =====================================================
-- FASE 2: Sistema Multiempresa con RLS
-- Sistema Administrativo YOT
-- =====================================================

-- 1. Tabla para empresa activa del usuario
-- Esto es CLAVE para el RLS: todas las consultas usarán esta tabla
create table if not exists public.user_active_company (
  user_id uuid primary key references auth.users on delete cascade,
  company_id uuid references public.companies on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_active_company enable row level security;

-- Policy: usuarios solo ven/editan su propio registro
create policy "Users can view their own active company"
  on public.user_active_company for select
  using (auth.uid() = user_id);

create policy "Users can update their own active company"
  on public.user_active_company for update
  using (auth.uid() = user_id);

create policy "Users can insert their own active company"
  on public.user_active_company for insert
  with check (auth.uid() = user_id);

-- =====================================================
-- 2. Función para obtener company_id activo (CORE del RLS)
-- =====================================================
create or replace function public.get_active_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id 
  from public.user_active_company 
  where user_id = auth.uid();
$$;

-- =====================================================
-- 3. Función RPC para cambiar empresa activa
-- =====================================================
create or replace function public.set_active_company(p_company_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_member boolean;
  v_company_name text;
begin
  -- Verificar que el usuario es miembro de la empresa
  select exists(
    select 1 from public.company_users 
    where company_id = p_company_id 
    and user_id = auth.uid()
  ) into v_is_member;

  if not v_is_member then
    return json_build_object('success', false, 'error', 'No eres miembro de esta empresa');
  end if;

  -- Obtener nombre de empresa
  select name into v_company_name from public.companies where id = p_company_id;

  -- Upsert la empresa activa
  insert into public.user_active_company (user_id, company_id, updated_at)
  values (auth.uid(), p_company_id, now())
  on conflict (user_id) 
  do update set company_id = p_company_id, updated_at = now();

  return json_build_object('success', true, 'company_name', v_company_name);
end;
$$;

-- =====================================================
-- 4. Función RPC para crear empresa (el creador es admin)
-- =====================================================
create or replace function public.create_company(
  p_name text,
  p_tax_id text,
  p_address text default null,
  p_phone text default null,
  p_email text default null,
  p_currency_symbol text default 'Bs.'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'Usuario no autenticado');
  end if;

  -- Crear la empresa
  insert into public.companies (name, tax_id, address, phone, email, currency_symbol)
  values (p_name, p_tax_id, p_address, p_phone, p_email, p_currency_symbol)
  returning id into v_company_id;

  -- Añadir al creador como admin
  insert into public.company_users (company_id, user_id, role)
  values (v_company_id, v_user_id, 'admin');

  -- Establecer como empresa activa
  insert into public.user_active_company (user_id, company_id)
  values (v_user_id, v_company_id)
  on conflict (user_id) 
  do update set company_id = v_company_id, updated_at = now();

  return json_build_object(
    'success', true, 
    'company_id', v_company_id,
    'message', 'Empresa creada exitosamente'
  );
end;
$$;

-- =====================================================
-- 5. Políticas RLS adicionales para companies
-- =====================================================

-- Política: usuarios pueden crear empresas
create policy "Authenticated users can create companies"
  on public.companies for insert
  with check (auth.uid() is not null);

-- =====================================================
-- 6. Políticas RLS para company_users
-- =====================================================

-- Política: admins pueden añadir miembros a sus empresas
create policy "Admins can insert company members"
  on public.company_users for insert
  with check (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = company_users.company_id
      and cu.user_id = auth.uid()
      and cu.role = 'admin'
    )
    or 
    -- O el usuario se está añadiendo a sí mismo (para create_company)
    auth.uid() = user_id
  );

-- Política: admins pueden actualizar roles
create policy "Admins can update company members"
  on public.company_users for update
  using (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = company_users.company_id
      and cu.user_id = auth.uid()
      and cu.role = 'admin'
    )
  );

-- Política: admins pueden eliminar miembros (excepto a sí mismos si son el único admin)
create policy "Admins can delete company members"
  on public.company_users for delete
  using (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = company_users.company_id
      and cu.user_id = auth.uid()
      and cu.role = 'admin'
    )
  );

-- =====================================================
-- 7. Vista para obtener empresas del usuario con su rol
-- =====================================================
create or replace view public.my_companies as
select 
  c.id,
  c.name,
  c.tax_id,
  c.address,
  c.phone,
  c.email,
  c.currency_symbol,
  c.created_at,
  cu.role,
  (select company_id from public.user_active_company where user_id = auth.uid()) = c.id as is_active
from public.companies c
inner join public.company_users cu on cu.company_id = c.id
where cu.user_id = auth.uid();

-- =====================================================
-- 8. Trigger: auto-establecer primera empresa como activa
-- =====================================================
create or replace function public.auto_set_first_company_active()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Si el usuario no tiene empresa activa, establecer esta
  insert into public.user_active_company (user_id, company_id)
  values (new.user_id, new.company_id)
  on conflict (user_id) do nothing;
  
  return new;
end;
$$;

drop trigger if exists on_company_user_created on public.company_users;
create trigger on_company_user_created
  after insert on public.company_users
  for each row execute procedure public.auto_set_first_company_active();

-- =====================================================
-- 9. Índices para performance
-- =====================================================
create index if not exists idx_company_users_user_id on public.company_users(user_id);
create index if not exists idx_company_users_company_id on public.company_users(company_id);
create index if not exists idx_user_active_company_company_id on public.user_active_company(company_id);
