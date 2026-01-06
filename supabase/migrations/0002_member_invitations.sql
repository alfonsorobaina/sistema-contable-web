-- =====================================================
-- FASE 2.5: Gestión de Miembros e Invitaciones
-- Sistema Administrativo YOT
-- =====================================================

-- 1. Tabla de invitaciones pendientes
create table if not exists public.company_invitations (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  email text not null,
  role text check (role in ('admin', 'accountant', 'member', 'viewer')) default 'member',
  invited_by uuid references auth.users not null,
  status text check (status in ('pending', 'accepted', 'expired', 'cancelled')) default 'pending',
  token uuid default gen_random_uuid() unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '7 days') not null,
  
  unique(company_id, email)
);

alter table public.company_invitations enable row level security;

-- Políticas RLS para invitaciones
create policy "Admins can view company invitations"
  on public.company_invitations for select
  using (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = company_invitations.company_id
      and cu.user_id = auth.uid()
      and cu.role = 'admin'
    )
  );

create policy "Admins can create invitations"
  on public.company_invitations for insert
  with check (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = company_invitations.company_id
      and cu.user_id = auth.uid()
      and cu.role = 'admin'
    )
  );

create policy "Admins can update invitations"
  on public.company_invitations for update
  using (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = company_invitations.company_id
      and cu.user_id = auth.uid()
      and cu.role = 'admin'
    )
  );

create policy "Admins can delete invitations"
  on public.company_invitations for delete
  using (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = company_invitations.company_id
      and cu.user_id = auth.uid()
      and cu.role = 'admin'
    )
  );

-- =====================================================
-- 2. Función RPC para obtener miembros de empresa activa
-- =====================================================
create or replace function public.get_company_members()
returns table (
  id uuid,
  user_id uuid,
  role text,
  created_at timestamp with time zone,
  email text,
  full_name text,
  avatar_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  -- Obtener empresa activa del usuario
  select company_id into v_company_id
  from public.user_active_company
  where user_id = auth.uid();

  if v_company_id is null then
    return;
  end if;

  return query
  select 
    cu.id,
    cu.user_id,
    cu.role,
    cu.created_at,
    u.email,
    p.full_name,
    p.avatar_url
  from public.company_users cu
  inner join auth.users u on u.id = cu.user_id
  left join public.profiles p on p.id = cu.user_id
  where cu.company_id = v_company_id
  order by cu.created_at;
end;
$$;

-- =====================================================
-- 3. Función RPC para invitar miembro
-- =====================================================
create or replace function public.invite_member(
  p_email text,
  p_role text default 'member'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_is_admin boolean;
  v_existing_user_id uuid;
  v_company_name text;
  v_invitation_id uuid;
begin
  -- Obtener empresa activa
  select company_id into v_company_id
  from public.user_active_company
  where user_id = auth.uid();

  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No tienes empresa activa');
  end if;

  -- Verificar que es admin
  select exists(
    select 1 from public.company_users
    where company_id = v_company_id
    and user_id = auth.uid()
    and role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    return json_build_object('success', false, 'error', 'Solo los administradores pueden invitar miembros');
  end if;

  -- Obtener nombre de empresa
  select name into v_company_name from public.companies where id = v_company_id;

  -- Verificar si el usuario ya existe
  select id into v_existing_user_id from auth.users where email = p_email;

  -- Si existe, verificar que no sea ya miembro
  if v_existing_user_id is not null then
    if exists(select 1 from public.company_users where company_id = v_company_id and user_id = v_existing_user_id) then
      return json_build_object('success', false, 'error', 'Este usuario ya es miembro de la empresa');
    end if;
    
    -- Añadir directamente como miembro
    insert into public.company_users (company_id, user_id, role)
    values (v_company_id, v_existing_user_id, p_role);
    
    return json_build_object(
      'success', true, 
      'added_directly', true,
      'message', 'Usuario añadido a la empresa'
    );
  end if;

  -- Si no existe, crear invitación
  insert into public.company_invitations (company_id, email, role, invited_by)
  values (v_company_id, p_email, p_role, auth.uid())
  on conflict (company_id, email) 
  do update set 
    role = excluded.role,
    status = 'pending',
    token = gen_random_uuid(),
    expires_at = timezone('utc'::text, now()) + interval '7 days'
  returning id into v_invitation_id;

  return json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'message', 'Invitación creada. El usuario recibirá acceso al registrarse con este email.'
  );
end;
$$;

-- =====================================================
-- 4. Función RPC para actualizar rol de miembro
-- =====================================================
create or replace function public.update_member_role(
  p_member_id uuid,
  p_new_role text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_target_company_id uuid;
  v_is_admin boolean;
  v_target_user_id uuid;
begin
  -- Obtener empresa activa
  select company_id into v_company_id
  from public.user_active_company
  where user_id = auth.uid();

  -- Obtener info del miembro a modificar
  select company_id, user_id into v_target_company_id, v_target_user_id
  from public.company_users
  where id = p_member_id;

  if v_target_company_id is null or v_target_company_id != v_company_id then
    return json_build_object('success', false, 'error', 'Miembro no encontrado');
  end if;

  -- Verificar que es admin
  select exists(
    select 1 from public.company_users
    where company_id = v_company_id
    and user_id = auth.uid()
    and role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    return json_build_object('success', false, 'error', 'Solo los administradores pueden cambiar roles');
  end if;

  -- No permitir cambiarse el rol a sí mismo si es el único admin
  if v_target_user_id = auth.uid() and p_new_role != 'admin' then
    if (select count(*) from public.company_users where company_id = v_company_id and role = 'admin') = 1 then
      return json_build_object('success', false, 'error', 'No puedes dejar la empresa sin administradores');
    end if;
  end if;

  -- Actualizar rol
  update public.company_users
  set role = p_new_role
  where id = p_member_id;

  return json_build_object('success', true, 'message', 'Rol actualizado');
end;
$$;

-- =====================================================
-- 5. Función RPC para eliminar miembro
-- =====================================================
create or replace function public.remove_member(p_member_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_target_company_id uuid;
  v_target_user_id uuid;
  v_is_admin boolean;
begin
  -- Obtener empresa activa
  select company_id into v_company_id
  from public.user_active_company
  where user_id = auth.uid();

  -- Obtener info del miembro
  select company_id, user_id into v_target_company_id, v_target_user_id
  from public.company_users
  where id = p_member_id;

  if v_target_company_id is null or v_target_company_id != v_company_id then
    return json_build_object('success', false, 'error', 'Miembro no encontrado');
  end if;

  -- Verificar que es admin
  select exists(
    select 1 from public.company_users
    where company_id = v_company_id
    and user_id = auth.uid()
    and role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    return json_build_object('success', false, 'error', 'Solo los administradores pueden eliminar miembros');
  end if;

  -- No permitir eliminarse a sí mismo si es el único admin
  if v_target_user_id = auth.uid() then
    if (select count(*) from public.company_users where company_id = v_company_id and role = 'admin') = 1 then
      return json_build_object('success', false, 'error', 'No puedes abandonar la empresa siendo el único administrador');
    end if;
  end if;

  -- Eliminar miembro
  delete from public.company_users where id = p_member_id;

  -- Si era su empresa activa, limpiar
  delete from public.user_active_company 
  where user_id = v_target_user_id 
  and company_id = v_company_id;

  return json_build_object('success', true, 'message', 'Miembro eliminado');
end;
$$;

-- =====================================================
-- 6. Trigger: auto-añadir usuario si tiene invitación
-- =====================================================
create or replace function public.check_pending_invitations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation record;
begin
  -- Buscar invitaciones pendientes para este email
  for v_invitation in 
    select * from public.company_invitations 
    where email = new.email 
    and status = 'pending'
    and expires_at > now()
  loop
    -- Añadir como miembro
    insert into public.company_users (company_id, user_id, role)
    values (v_invitation.company_id, new.id, v_invitation.role)
    on conflict do nothing;
    
    -- Marcar invitación como aceptada
    update public.company_invitations
    set status = 'accepted'
    where id = v_invitation.id;
  end loop;
  
  return new;
end;
$$;

drop trigger if exists on_user_check_invitations on auth.users;
create trigger on_user_check_invitations
  after insert on auth.users
  for each row execute procedure public.check_pending_invitations();

-- =====================================================
-- 7. Vista para invitaciones de empresa activa
-- =====================================================
create or replace view public.my_company_invitations as
select 
  ci.id,
  ci.email,
  ci.role,
  ci.status,
  ci.created_at,
  ci.expires_at
from public.company_invitations ci
where ci.company_id = public.get_active_company_id()
and ci.status = 'pending'
order by ci.created_at desc;

-- =====================================================
-- 8. Índices
-- =====================================================
create index if not exists idx_invitations_company on public.company_invitations(company_id);
create index if not exists idx_invitations_email on public.company_invitations(email);
create index if not exists idx_invitations_status on public.company_invitations(status);
