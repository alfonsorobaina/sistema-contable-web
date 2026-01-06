-- =====================================================
-- FASE 3: Módulo de Contabilidad
-- Sistema Administrativo YOT
-- =====================================================

-- =====================================================
-- 1. Tabla de Períodos Fiscales
-- =====================================================
create table if not exists public.fiscal_periods (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_closed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint valid_date_range check (end_date >= start_date)
);

alter table public.fiscal_periods enable row level security;

create policy "Users can view fiscal periods of their active company"
  on public.fiscal_periods for select
  using (company_id = public.get_active_company_id());

create policy "Admins can insert fiscal periods"
  on public.fiscal_periods for insert
  with check (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant')
    )
  );

create policy "Admins can update fiscal periods"
  on public.fiscal_periods for update
  using (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant')
    )
  );

-- =====================================================
-- 2. Plan de Cuentas (Chart of Accounts)
-- =====================================================
create table if not exists public.chart_of_accounts (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  parent_id uuid references public.chart_of_accounts on delete restrict,
  code text not null,
  name text not null,
  account_type text not null check (account_type in (
    'asset',      -- Activo
    'liability',  -- Pasivo
    'equity',     -- Patrimonio
    'income',     -- Ingreso
    'expense'     -- Egreso/Gasto
  )),
  is_parent boolean default false,
  is_active boolean default true,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_code_per_company unique (company_id, code)
);

alter table public.chart_of_accounts enable row level security;

create policy "Users can view accounts of their active company"
  on public.chart_of_accounts for select
  using (company_id = public.get_active_company_id());

create policy "Admins can insert accounts"
  on public.chart_of_accounts for insert
  with check (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant')
    )
  );

create policy "Admins can update accounts"
  on public.chart_of_accounts for update
  using (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant')
    )
  );

create policy "Admins can delete accounts"
  on public.chart_of_accounts for delete
  using (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant')
    )
  );

-- =====================================================
-- 3. Asientos Contables (Journal Entries)
-- =====================================================
create table if not exists public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  fiscal_period_id uuid references public.fiscal_periods on delete restrict,
  entry_number serial,
  entry_date date not null,
  description text not null,
  reference text,
  status text default 'draft' check (status in ('draft', 'posted', 'cancelled')),
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  posted_at timestamp with time zone
);

alter table public.journal_entries enable row level security;

create policy "Users can view entries of their active company"
  on public.journal_entries for select
  using (company_id = public.get_active_company_id());

create policy "Users can insert entries"
  on public.journal_entries for insert
  with check (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant', 'member')
    )
  );

create policy "Users can update draft entries"
  on public.journal_entries for update
  using (
    company_id = public.get_active_company_id()
    and status = 'draft'
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant')
    )
  );

-- =====================================================
-- 4. Líneas de Asientos (Journal Entry Lines)
-- =====================================================
create table if not exists public.journal_entry_lines (
  id uuid default gen_random_uuid() primary key,
  journal_entry_id uuid references public.journal_entries on delete cascade not null,
  account_id uuid references public.chart_of_accounts on delete restrict not null,
  description text,
  debit numeric(15, 2) default 0 not null check (debit >= 0),
  credit numeric(15, 2) default 0 not null check (credit >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint debit_or_credit check (
    (debit > 0 and credit = 0) or (credit > 0 and debit = 0)
  )
);

alter table public.journal_entry_lines enable row level security;

create policy "Users can view entry lines"
  on public.journal_entry_lines for select
  using (
    exists (
      select 1 from public.journal_entries je
      where je.id = journal_entry_lines.journal_entry_id
      and je.company_id = public.get_active_company_id()
    )
  );

create policy "Users can insert entry lines"
  on public.journal_entry_lines for insert
  with check (
    exists (
      select 1 from public.journal_entries je
      where je.id = journal_entry_lines.journal_entry_id
      and je.company_id = public.get_active_company_id()
      and je.status = 'draft'
    )
  );

create policy "Users can update entry lines"
  on public.journal_entry_lines for update
  using (
    exists (
      select 1 from public.journal_entries je
      where je.id = journal_entry_lines.journal_entry_id
      and je.company_id = public.get_active_company_id()
      and je.status = 'draft'
    )
  );

create policy "Users can delete entry lines"
  on public.journal_entry_lines for delete
  using (
    exists (
      select 1 from public.journal_entries je
      where je.id = journal_entry_lines.journal_entry_id
      and je.company_id = public.get_active_company_id()
      and je.status = 'draft'
    )
  );

-- =====================================================
-- 5. Función para crear asiento con líneas
-- =====================================================
create or replace function public.create_journal_entry(
  p_entry_date date,
  p_description text,
  p_reference text,
  p_lines jsonb -- [{account_id, description, debit, credit}]
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_entry_id uuid;
  v_total_debit numeric := 0;
  v_total_credit numeric := 0;
  v_line jsonb;
  v_fiscal_period_id uuid;
begin
  -- Obtener empresa activa
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No tienes empresa activa');
  end if;
  
  -- Buscar período fiscal activo
  select id into v_fiscal_period_id
  from public.fiscal_periods
  where company_id = v_company_id
  and p_entry_date between start_date and end_date
  and is_closed = false
  limit 1;
  
  -- Validar balance
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_total_debit := v_total_debit + coalesce((v_line->>'debit')::numeric, 0);
    v_total_credit := v_total_credit + coalesce((v_line->>'credit')::numeric, 0);
  end loop;
  
  if v_total_debit != v_total_credit then
    return json_build_object(
      'success', false, 
      'error', 'El asiento no está balanceado. Débito: ' || v_total_debit || ', Crédito: ' || v_total_credit
    );
  end if;
  
  if v_total_debit = 0 then
    return json_build_object('success', false, 'error', 'El asiento debe tener al menos una línea');
  end if;
  
  -- Crear asiento
  insert into public.journal_entries (company_id, fiscal_period_id, entry_date, description, reference, created_by)
  values (v_company_id, v_fiscal_period_id, p_entry_date, p_description, p_reference, auth.uid())
  returning id into v_entry_id;
  
  -- Crear líneas
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    values (
      v_entry_id,
      (v_line->>'account_id')::uuid,
      v_line->>'description',
      coalesce((v_line->>'debit')::numeric, 0),
      coalesce((v_line->>'credit')::numeric, 0)
    );
  end loop;
  
  return json_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'message', 'Asiento creado correctamente'
  );
end;
$$;

-- =====================================================
-- 6. Función para obtener balance de cuentas
-- =====================================================
create or replace function public.get_account_balances(
  p_as_of_date date default current_date
)
returns table (
  account_id uuid,
  account_code text,
  account_name text,
  account_type text,
  total_debit numeric,
  total_credit numeric,
  balance numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return;
  end if;
  
  return query
  select 
    coa.id as account_id,
    coa.code as account_code,
    coa.name as account_name,
    coa.account_type,
    coalesce(sum(jel.debit), 0) as total_debit,
    coalesce(sum(jel.credit), 0) as total_credit,
    case 
      when coa.account_type in ('asset', 'expense') then coalesce(sum(jel.debit), 0) - coalesce(sum(jel.credit), 0)
      else coalesce(sum(jel.credit), 0) - coalesce(sum(jel.debit), 0)
    end as balance
  from public.chart_of_accounts coa
  left join public.journal_entry_lines jel on jel.account_id = coa.id
  left join public.journal_entries je on je.id = jel.journal_entry_id
    and je.status = 'posted'
    and je.entry_date <= p_as_of_date
  where coa.company_id = v_company_id
  and coa.is_active = true
  and coa.is_parent = false
  group by coa.id, coa.code, coa.name, coa.account_type
  order by coa.code;
end;
$$;

-- =====================================================
-- 7. Función para importar plan contable básico
-- =====================================================
create or replace function public.import_basic_chart_of_accounts()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_count int := 0;
begin
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No tienes empresa activa');
  end if;
  
  -- Verificar que no existan cuentas
  if exists (select 1 from public.chart_of_accounts where company_id = v_company_id) then
    return json_build_object('success', false, 'error', 'Ya existen cuentas en esta empresa');
  end if;
  
  -- ACTIVOS
  insert into public.chart_of_accounts (company_id, code, name, account_type, is_parent) values
    (v_company_id, '1', 'ACTIVO', 'asset', true),
    (v_company_id, '1.1', 'ACTIVO CORRIENTE', 'asset', true),
    (v_company_id, '1.1.01', 'Caja', 'asset', false),
    (v_company_id, '1.1.02', 'Bancos', 'asset', false),
    (v_company_id, '1.1.03', 'Cuentas por Cobrar', 'asset', false),
    (v_company_id, '1.1.04', 'Inventarios', 'asset', false),
    (v_company_id, '1.2', 'ACTIVO NO CORRIENTE', 'asset', true),
    (v_company_id, '1.2.01', 'Mobiliario y Equipo', 'asset', false),
    (v_company_id, '1.2.02', 'Vehículos', 'asset', false),
    (v_company_id, '1.2.03', 'Edificios', 'asset', false),
    (v_company_id, '1.2.04', 'Depreciación Acumulada', 'asset', false);
  
  -- PASIVOS
  insert into public.chart_of_accounts (company_id, code, name, account_type, is_parent) values
    (v_company_id, '2', 'PASIVO', 'liability', true),
    (v_company_id, '2.1', 'PASIVO CORRIENTE', 'liability', true),
    (v_company_id, '2.1.01', 'Cuentas por Pagar', 'liability', false),
    (v_company_id, '2.1.02', 'Impuestos por Pagar', 'liability', false),
    (v_company_id, '2.1.03', 'Sueldos por Pagar', 'liability', false),
    (v_company_id, '2.2', 'PASIVO NO CORRIENTE', 'liability', true),
    (v_company_id, '2.2.01', 'Préstamos Bancarios', 'liability', false);
  
  -- PATRIMONIO
  insert into public.chart_of_accounts (company_id, code, name, account_type, is_parent) values
    (v_company_id, '3', 'PATRIMONIO', 'equity', true),
    (v_company_id, '3.1', 'Capital Social', 'equity', false),
    (v_company_id, '3.2', 'Reservas', 'equity', false),
    (v_company_id, '3.3', 'Utilidades Retenidas', 'equity', false),
    (v_company_id, '3.4', 'Utilidad del Ejercicio', 'equity', false);
  
  -- INGRESOS
  insert into public.chart_of_accounts (company_id, code, name, account_type, is_parent) values
    (v_company_id, '4', 'INGRESOS', 'income', true),
    (v_company_id, '4.1', 'Ventas', 'income', false),
    (v_company_id, '4.2', 'Servicios Prestados', 'income', false),
    (v_company_id, '4.3', 'Otros Ingresos', 'income', false);
  
  -- GASTOS
  insert into public.chart_of_accounts (company_id, code, name, account_type, is_parent) values
    (v_company_id, '5', 'GASTOS', 'expense', true),
    (v_company_id, '5.1', 'GASTOS OPERATIVOS', 'expense', true),
    (v_company_id, '5.1.01', 'Sueldos y Salarios', 'expense', false),
    (v_company_id, '5.1.02', 'Alquiler', 'expense', false),
    (v_company_id, '5.1.03', 'Servicios Públicos', 'expense', false),
    (v_company_id, '5.1.04', 'Publicidad', 'expense', false),
    (v_company_id, '5.1.05', 'Depreciación', 'expense', false),
    (v_company_id, '5.2', 'GASTOS FINANCIEROS', 'expense', true),
    (v_company_id, '5.2.01', 'Intereses Bancarios', 'expense', false),
    (v_company_id, '5.2.02', 'Comisiones Bancarias', 'expense', false);
  
  -- Contar cuentas creadas
  select count(*) into v_count from public.chart_of_accounts where company_id = v_company_id;
  
  return json_build_object(
    'success', true,
    'count', v_count,
    'message', 'Plan de cuentas importado correctamente'
  );
end;
$$;

-- =====================================================
-- 8. Índices para performance
-- =====================================================
create index if not exists idx_chart_of_accounts_company on public.chart_of_accounts(company_id);
create index if not exists idx_chart_of_accounts_type on public.chart_of_accounts(account_type);
create index if not exists idx_journal_entries_company on public.journal_entries(company_id);
create index if not exists idx_journal_entries_date on public.journal_entries(entry_date);
create index if not exists idx_journal_entry_lines_entry on public.journal_entry_lines(journal_entry_id);
create index if not exists idx_journal_entry_lines_account on public.journal_entry_lines(account_id);
create index if not exists idx_fiscal_periods_company on public.fiscal_periods(company_id);
