-- =====================================================
-- FASE 8: Nómina (Payroll)
-- Sistema Administrativo YOT
-- =====================================================

-- =====================================================
-- 1. Empleados (Employees)
-- =====================================================
create table if not exists public.employees (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  
  -- Identificación
  first_name text not null,
  last_name text not null,
  document_id text not null, -- Cédula
  email text,
  phone text,
  address text,
  
  -- Datos Laborales
  hire_date date not null,
  position text,
  department text,
  base_salary numeric(15, 2) not null check (base_salary >= 0),
  
  -- Configuraciones legales Venezuela
  risk_level text default 'minimum' check (risk_level in ('minimum', 'medium', 'maximum')), -- Para IVSS patronal
  
  -- Datos de Pago
  payment_method text default 'transfer' check (payment_method in ('transfer', 'cash', 'check')),
  bank_account_info jsonb, -- bank_name, account_number, etc.
  
  -- Estado
  is_active boolean default true,
  status text default 'active' check (status in ('active', 'vacation', 'suspended', 'terminated')),
  
  -- Auditoría
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_employee_document unique (company_id, document_id)
);

alter table public.employees enable row level security;

create policy "Users can view employees"
  on public.employees for select
  using (company_id = public.get_active_company_id());

create policy "Admins can manage employees"
  on public.employees for all
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
-- 2. Conceptos de Nómina (Payroll Concepts)
-- Configurable para IVSS, FAOV, etc.
-- =====================================================
create table if not exists public.payroll_concepts (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  
  code text not null, -- Ej: SALARIO_BASE, IVSS_EMP, FAOV_PAT
  name text not null,
  
  -- Tipo: cobro (earning), deducción (deduction), aporte patronal (company_contribution)
  concept_type text not null check (concept_type in ('earning', 'deduction', 'company_contribution')),
  
  -- Configuración de cálculo
  is_fixed_amount boolean default false, -- true = monto fijo, false = porcentaje/fórmula
  amount numeric(15, 4) not null default 0, -- El valor del porcentaje (0.04) o monto fijo
  
  -- Códigos especiales para lógica automática
  -- 'BASIC_SALARY', 'CESTATICKET', 'IVSS_EMP', 'IVSS_PAT', 'FAOV_EMP', 'FAOV_PAT', 'RPE_EMP', 'RPE_PAT'
  system_code text, 
  
  -- Contabilidad
  chart_account_id uuid references public.chart_of_accounts,
  
  -- Estado
  is_active boolean default true,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_concept_code unique (company_id, code)
);

alter table public.payroll_concepts enable row level security;

create policy "Users can view concepts"
  on public.payroll_concepts for select
  using (company_id = public.get_active_company_id());

create policy "Admins can manage concepts"
  on public.payroll_concepts for all
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
-- 3. Nóminas (Payroll Runs)
-- =====================================================
create table if not exists public.payroll_runs (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  
  -- Período
  period_start date not null,
  period_end date not null,
  payment_date date,
  name text, -- Ej: "Primera Quincena Enero 2026"
  
  -- Totales
  total_earnings numeric(15, 2) default 0,
  total_deductions numeric(15, 2) default 0,
  total_company_contributions numeric(15, 2) default 0,
  net_total numeric(15, 2) default 0, -- earnings - deductions
  
  -- Configuración usada
  exchange_rate numeric(15, 2) default 1, -- Tasa BCV
  
  -- Estado
  status text default 'draft' check (status in ('draft', 'approved', 'paid', 'void')),
  
  -- Contabilidad
  journal_entry_id uuid references public.journal_entries,
  
  -- Auditoría
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payroll_runs enable row level security;

create policy "Users can view payroll runs"
  on public.payroll_runs for select
  using (company_id = public.get_active_company_id());

create policy "Admins can manage payroll runs"
  on public.payroll_runs for all
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
-- 4. Líneas de Nómina (Payroll Lines)
-- =====================================================
create table if not exists public.payroll_lines (
  id uuid default gen_random_uuid() primary key,
  payroll_run_id uuid references public.payroll_runs on delete cascade not null,
  employee_id uuid references public.employees on delete restrict not null,
  concept_id uuid references public.payroll_concepts on delete restrict not null,
  
  amount numeric(15, 2) not null,
  
  -- Snapshot de datos al momento del cálculo
  concept_name text,
  concept_type text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payroll_lines enable row level security;

create policy "Users can view payroll lines"
  on public.payroll_lines for select
  using (
    exists (
      select 1 from public.payroll_runs r 
      where r.id = payroll_run_id 
      and r.company_id = public.get_active_company_id()
    )
  );

-- =====================================================
-- 5. Función: Inicializar Conceptos de Ley Venezuela
-- Crea los conceptos base si no existen
-- =====================================================
create or replace function public.initialize_venezuela_payroll_concepts(p_company_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- 1. Salario Base
  insert into public.payroll_concepts (company_id, code, name, concept_type, is_fixed_amount, amount, system_code)
  values (p_company_id, 'SUELDO', 'Sueldo Base', 'earning', false, 1, 'BASIC_SALARY')
  on conflict (company_id, code) do nothing;

  -- 2. Cestaticket (Monto referencial, se edita)
  insert into public.payroll_concepts (company_id, code, name, concept_type, is_fixed_amount, amount, system_code)
  values (p_company_id, 'CESTATICKET', 'Cestaticket Socialista', 'earning', true, 1600, 'CESTATICKET') -- Ejemplo monto en Bs
  on conflict (company_id, code) do nothing;

  -- 3. IVSS Empleado (4%)
  insert into public.payroll_concepts (company_id, code, name, concept_type, is_fixed_amount, amount, system_code)
  values (p_company_id, 'IVSS_EMP', 'Retención IVSS (S.S.O)', 'deduction', false, 0.04, 'IVSS_EMP')
  on conflict (company_id, code) do nothing;

  -- 4. FAOV Empleado (1%)
  insert into public.payroll_concepts (company_id, code, name, concept_type, is_fixed_amount, amount, system_code)
  values (p_company_id, 'FAOV_EMP', 'Retención FAOV (Vivienda)', 'deduction', false, 0.01, 'FAOV_EMP')
  on conflict (company_id, code) do nothing;

  -- 5. Paro Forzoso Empleado (0.5%)
  insert into public.payroll_concepts (company_id, code, name, concept_type, is_fixed_amount, amount, system_code)
  values (p_company_id, 'RPE_EMP', 'Retención RPE (Paro Forzoso)', 'deduction', false, 0.005, 'RPE_EMP')
  on conflict (company_id, code) do nothing;

  -- APORTES PATRONALES
  
  -- 6. IVSS Patrono (Riesgo Mínimo 9% default)
  insert into public.payroll_concepts (company_id, code, name, concept_type, is_fixed_amount, amount, system_code)
  values (p_company_id, 'IVSS_PAT', 'Aporte Patronal IVSS', 'company_contribution', false, 0.09, 'IVSS_PAT')
  on conflict (company_id, code) do nothing;
  
  -- 7. FAOV Patrono (2%)
  insert into public.payroll_concepts (company_id, code, name, concept_type, is_fixed_amount, amount, system_code)
  values (p_company_id, 'FAOV_PAT', 'Aporte Patronal FAOV', 'company_contribution', false, 0.02, 'FAOV_PAT')
  on conflict (company_id, code) do nothing;
  
  -- 8. RPE Patrono (2%)
  insert into public.payroll_concepts (company_id, code, name, concept_type, is_fixed_amount, amount, system_code)
  values (p_company_id, 'RPE_PAT', 'Aporte Patronal RPE', 'company_contribution', false, 0.02, 'RPE_PAT')
  on conflict (company_id, code) do nothing;

end;
$$;

-- =====================================================
-- 6. Función: Generar Nómina (Run Payroll)
-- Usa los porcentajes configurados en concepts
-- =====================================================
create or replace function public.run_payroll(
  p_start_date date,
  p_end_date date,
  p_name text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_run_id uuid;
  v_employee record;
  v_concept record;
  v_amount numeric;
  v_days_in_period integer;
  v_base_salary_period numeric;
  v_total_earnings numeric := 0;
  v_total_deductions numeric := 0;
  v_total_contributions numeric := 0;
  
  -- Variables para tasas leídas de configuración
  v_ivss_emp_rate numeric;
  v_faov_emp_rate numeric;
  v_rpe_emp_rate numeric;
  v_ivss_pat_rate numeric; -- base, a ajustar por riesgo
  v_faov_pat_rate numeric;
  v_rpe_pat_rate numeric;
  v_cestaticket_amount numeric;
  
  -- IDs de conceptos
  v_id_sueldo uuid;
  v_id_cesta uuid;
  v_id_ivss_emp uuid;
  v_id_faov_emp uuid;
  v_id_rpe_emp uuid;
  v_id_ivss_pat uuid;
  v_id_faov_pat uuid;
  v_id_rpe_pat uuid;

begin
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No hay empresa activa');
  end if;

  -- 1. Asegurar conceptos base existen
  perform public.initialize_venezuela_payroll_concepts(v_company_id);

  -- 2. Leer configuraciones actuales (tasas y montos)
  select amount, id into v_ivss_emp_rate, v_id_ivss_emp from payroll_concepts where company_id = v_company_id and system_code = 'IVSS_EMP';
  select amount, id into v_faov_emp_rate, v_id_faov_emp from payroll_concepts where company_id = v_company_id and system_code = 'FAOV_EMP';
  select amount, id into v_rpe_emp_rate, v_id_rpe_emp from payroll_concepts where company_id = v_company_id and system_code = 'RPE_EMP';
  select amount, id into v_cestaticket_amount, v_id_cesta from payroll_concepts where company_id = v_company_id and system_code = 'CESTATICKET';
  select id into v_id_sueldo from payroll_concepts where company_id = v_company_id and system_code = 'BASIC_SALARY';
  
  -- Patronales
  select amount, id into v_ivss_pat_rate, v_id_ivss_pat from payroll_concepts where company_id = v_company_id and system_code = 'IVSS_PAT';
  select amount, id into v_faov_pat_rate, v_id_faov_pat from payroll_concepts where company_id = v_company_id and system_code = 'FAOV_PAT';
  select amount, id into v_rpe_pat_rate, v_id_rpe_pat from payroll_concepts where company_id = v_company_id and system_code = 'RPE_PAT';

  -- 3. Crear cabecera de nómina
  insert into public.payroll_runs (
    company_id, period_start, period_end, name, status, created_by
  ) values (
    v_company_id, p_start_date, p_end_date, 
    coalesce(p_name, 'Nómina ' || to_char(p_start_date, 'DD/MM/YYYY') || ' - ' || to_char(p_end_date, 'DD/MM/YYYY')),
    'draft', auth.uid()
  ) returning id into v_run_id;

  -- Días en el periodo (calculado simple para quincenal/mensual, asumiendo 30 días base comercial si es mes completo)
  -- Para simplificar, usaremos días calendario entre fechas + 1
  v_days_in_period := (p_end_date - p_start_date) + 1;

  -- 4. Iterar empleados activos
  for v_employee in select * from public.employees where company_id = v_company_id and is_active = true loop
    
    -- A. Salario Base del Periodo
    -- Cálculo: (Salario Mensual / 30) * Días trabajados
    v_base_salary_period := (v_employee.base_salary / 30.0) * v_days_in_period;
    
    insert into public.payroll_lines (payroll_run_id, employee_id, concept_id, amount, concept_name, concept_type)
    values (v_run_id, v_employee.id, v_id_sueldo, v_base_salary_period, 'Sueldo Base', 'earning');
    v_total_earnings := v_total_earnings + v_base_salary_period;

    -- B. Cestaticket (Fijo, asignar completo si trabajó el periodo o proporcional)
    -- Asumimos proporcional por ahora
    -- Nota: Cestaticket suele ser mensual, si la nómina es quincenal se paga la mitad
    if v_days_in_period >= 13 and v_days_in_period <= 16 then
        v_amount := v_cestaticket_amount / 2; -- Quincena
    else
        v_amount := (v_cestaticket_amount / 30.0) * v_days_in_period; -- Otros
    end if;

    insert into public.payroll_lines (payroll_run_id, employee_id, concept_id, amount, concept_name, concept_type)
    values (v_run_id, v_employee.id, v_id_cesta, v_amount, 'Cestaticket', 'earning');
    v_total_earnings := v_total_earnings + v_amount;

    -- C. Deducciones de Ley (Sobre Salario Base, con topes)
    -- TODO: Implementar lógica exacta de topes (5 salarios mínimos) si se tuviera el valor del salario mínimo en BD.
    -- Por ahora aplicamos porcentaje directo al salario base del periodo.
    
    -- IVSS Empleado
    v_amount := v_base_salary_period * v_ivss_emp_rate;
    insert into public.payroll_lines (payroll_run_id, employee_id, concept_id, amount, concept_name, concept_type)
    values (v_run_id, v_employee.id, v_id_ivss_emp, v_amount, 'Retención IVSS', 'deduction');
    v_total_deductions := v_total_deductions + v_amount;

    -- FAOV Empleado (Sobre integral, aquí simplificado a base + bonos salariales, asumiendo solo base por ahora)
    v_amount := v_base_salary_period * v_faov_emp_rate;
    insert into public.payroll_lines (payroll_run_id, employee_id, concept_id, amount, concept_name, concept_type)
    values (v_run_id, v_employee.id, v_id_faov_emp, v_amount, 'Retención FAOV', 'deduction');
    v_total_deductions := v_total_deductions + v_amount;

    -- RPE Empleado
    v_amount := v_base_salary_period * v_rpe_emp_rate;
    insert into public.payroll_lines (payroll_run_id, employee_id, concept_id, amount, concept_name, concept_type)
    values (v_run_id, v_employee.id, v_id_rpe_emp, v_amount, 'Retención RPE', 'deduction');
    v_total_deductions := v_total_deductions + v_amount;

    -- D. Aportes Patronales
    -- IVSS Patrono (Ajustar por riesgo)
    declare
        v_final_ivss_pat_rate numeric;
    begin
        v_final_ivss_pat_rate := v_ivss_pat_rate; -- Base (mínimo)
        if v_employee.risk_level = 'medium' then
             v_final_ivss_pat_rate := 0.10; -- Podría leerse de config también si se modelara más complejo
        elsif v_employee.risk_level = 'maximum' then
             v_final_ivss_pat_rate := 0.11;
        end if;
        
        v_amount := v_base_salary_period * v_final_ivss_pat_rate;
        insert into public.payroll_lines (payroll_run_id, employee_id, concept_id, amount, concept_name, concept_type)
        values (v_run_id, v_employee.id, v_id_ivss_pat, v_amount, 'Aporte Patronal IVSS', 'company_contribution');
        v_total_company_contributions := v_total_company_contributions + v_amount;
    end;

    -- FAOV Patrono
    v_amount := v_base_salary_period * v_faov_pat_rate;
    insert into public.payroll_lines (payroll_run_id, employee_id, concept_id, amount, concept_name, concept_type)
    values (v_run_id, v_employee.id, v_id_faov_pat, v_amount, 'Aporte Patronal FAOV', 'company_contribution');
    v_total_company_contributions := v_total_company_contributions + v_amount;

    -- RPE Patrono
    v_amount := v_base_salary_period * v_rpe_pat_rate;
    insert into public.payroll_lines (payroll_run_id, employee_id, concept_id, amount, concept_name, concept_type)
    values (v_run_id, v_employee.id, v_id_rpe_pat, v_amount, 'Aporte Patronal RPE', 'company_contribution');
    v_total_company_contributions := v_total_company_contributions + v_amount;

  end loop;

  -- 5. Actualizar totales cabecera
  update public.payroll_runs
  set total_earnings = v_total_earnings,
      total_deductions = v_total_deductions,
      total_company_contributions = v_total_company_contributions,
      net_total = v_total_earnings - v_total_deductions,
      updated_at = now()
  where id = v_run_id;

  return json_build_object(
    'success', true,
    'payroll_run_id', v_run_id,
    'message', 'Nómina generada exitosamente'
  );
end;
$$;

-- =====================================================
-- 7. Índices
-- =====================================================
create index if not exists idx_employees_company on public.employees(company_id);
create index if not exists idx_employees_active on public.employees(is_active);
create index if not exists idx_payroll_concepts_company on public.payroll_concepts(company_id);
create index if not exists idx_payroll_runs_company on public.payroll_runs(company_id);
create index if not exists idx_payroll_lines_run on public.payroll_lines(payroll_run_id);
create index if not exists idx_payroll_lines_employee on public.payroll_lines(employee_id);
