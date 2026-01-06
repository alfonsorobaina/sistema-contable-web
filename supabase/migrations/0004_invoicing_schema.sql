-- =====================================================
-- FASE 4: Facturación Fiscal Venezuela (SENIAT)
-- Sistema Administrativo YOT
-- Providencia SNAT/2024/000102
-- =====================================================

-- =====================================================
-- 1. Clientes (Customers)
-- =====================================================
create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  
  -- Identificación fiscal
  rif text not null,  -- J-12345678-9, V-12345678-9, G-12345678-9, etc.
  rif_type text not null check (rif_type in ('J', 'V', 'G', 'E', 'P', 'C')),
  
  -- Datos básicos
  name text not null,
  trade_name text,  -- Nombre comercial (opcional)
  
  -- Contacto
  address text,
  city text,
  state text,
  phone text,
  email text,
  
  -- Control
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_rif_per_company unique (company_id, rif)
);

alter table public.customers enable row level security;

create policy "Users can view customers of their active company"
  on public.customers for select
  using (company_id = public.get_active_company_id());

create policy "Users can insert customers"
  on public.customers for insert
  with check (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant', 'member')
    )
  );

create policy "Users can update customers"
  on public.customers for update
  using (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant', 'member')
    )
  );

-- =====================================================
-- 2. Perfiles de Impuesto (Configurables)
-- =====================================================
create table if not exists public.tax_profiles (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  
  name text not null,  -- "IVA General", "Exento", "Reducido"
  rate numeric(5, 2) not null check (rate >= 0 and rate <= 100),  -- 16.00, 0.00, 8.00
  is_default boolean default false,
  is_active boolean default true,
  
  -- Para asiento contable
  sales_account_id uuid references public.chart_of_accounts,  -- Cuenta de ventas
  tax_account_id uuid references public.chart_of_accounts,    -- Cuenta IVA por pagar
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_tax_name_per_company unique (company_id, name)
);

alter table public.tax_profiles enable row level security;

create policy "Users can view tax profiles of their active company"
  on public.tax_profiles for select
  using (company_id = public.get_active_company_id());

create policy "Admins can manage tax profiles"
  on public.tax_profiles for all
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
-- 3. Secuencias Fiscales (Numeración)
-- =====================================================
create table if not exists public.fiscal_sequences (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  
  sequence_type text not null check (sequence_type in ('invoice', 'credit_note', 'debit_note')),
  
  -- Número de factura
  prefix text default '',  -- Ej: "FAC-"
  current_number integer default 0 not null,
  
  -- Número de control (obligatorio SENIAT)
  control_prefix text default '',  -- Ej: "00-"
  control_current integer default 0 not null,
  
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_sequence_type_per_company unique (company_id, sequence_type)
);

alter table public.fiscal_sequences enable row level security;

create policy "Users can view fiscal sequences"
  on public.fiscal_sequences for select
  using (company_id = public.get_active_company_id());

create policy "Admins can manage fiscal sequences"
  on public.fiscal_sequences for all
  using (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role = 'admin'
    )
  );

-- =====================================================
-- 4. Facturas (Invoices)
-- =====================================================
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  customer_id uuid references public.customers on delete restrict not null,
  
  -- Numeración fiscal (se asigna al emitir)
  invoice_number text,  -- "FAC-00001"
  control_number text,  -- "00-00001234" (obligatorio SENIAT)
  
  -- Fechas
  invoice_date date not null,
  due_date date,
  
  -- Estado
  status text default 'draft' not null check (status in ('draft', 'issued', 'paid', 'cancelled')),
  
  -- Montos (calculados)
  subtotal numeric(15, 2) default 0 not null,
  tax_amount numeric(15, 2) default 0 not null,
  total numeric(15, 2) default 0 not null,
  
  -- Moneda (para facturación en USD si aplica)
  currency text default 'VES' not null,
  exchange_rate numeric(15, 4) default 1 not null,
  
  -- Notas
  notes text,
  
  -- Asiento contable vinculado
  journal_entry_id uuid references public.journal_entries,
  
  -- Auditoría
  created_by uuid references auth.users not null,
  issued_at timestamp with time zone,
  issued_by uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.invoices enable row level security;

create policy "Users can view invoices of their active company"
  on public.invoices for select
  using (company_id = public.get_active_company_id());

create policy "Users can insert invoices"
  on public.invoices for insert
  with check (
    company_id = public.get_active_company_id()
    and status = 'draft'
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant', 'member')
    )
  );

-- Solo borradores pueden editarse
create policy "Users can update draft invoices"
  on public.invoices for update
  using (
    company_id = public.get_active_company_id()
    and status = 'draft'
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant', 'member')
    )
  );

-- =====================================================
-- 5. Líneas de Factura (Invoice Lines)
-- =====================================================
create table if not exists public.invoice_lines (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices on delete cascade not null,
  
  -- Producto/Servicio
  description text not null,
  quantity numeric(10, 2) default 1 not null check (quantity > 0),
  unit_price numeric(15, 2) not null check (unit_price >= 0),
  
  -- Impuesto
  tax_profile_id uuid references public.tax_profiles,
  tax_rate numeric(5, 2) default 0 not null,
  tax_amount numeric(15, 2) default 0 not null,
  
  -- Totales
  line_subtotal numeric(15, 2) default 0 not null,
  line_total numeric(15, 2) default 0 not null,
  
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.invoice_lines enable row level security;

create policy "Users can view invoice lines"
  on public.invoice_lines for select
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_lines.invoice_id
      and i.company_id = public.get_active_company_id()
    )
  );

create policy "Users can manage lines of draft invoices"
  on public.invoice_lines for all
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_lines.invoice_id
      and i.company_id = public.get_active_company_id()
      and i.status = 'draft'
    )
  );

-- =====================================================
-- 6. Notas de Crédito
-- =====================================================
create table if not exists public.credit_notes (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  invoice_id uuid references public.invoices on delete restrict not null,
  
  -- Numeración
  note_number text not null,
  control_number text not null,
  
  -- Datos
  note_date date not null,
  reason text not null,
  
  -- Montos (iguales a la factura original)
  subtotal numeric(15, 2) not null,
  tax_amount numeric(15, 2) not null,
  total numeric(15, 2) not null,
  
  -- Asiento contable inverso
  journal_entry_id uuid references public.journal_entries,
  
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.credit_notes enable row level security;

create policy "Users can view credit notes"
  on public.credit_notes for select
  using (company_id = public.get_active_company_id());

create policy "Admins can create credit notes"
  on public.credit_notes for insert
  with check (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant')
    )
  );

-- =====================================================
-- 7. Función: Obtener siguiente número fiscal
-- =====================================================
create or replace function public.get_next_fiscal_number(
  p_sequence_type text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_seq record;
  v_invoice_number text;
  v_control_number text;
begin
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No hay empresa activa');
  end if;
  
  -- Obtener y bloquear secuencia
  select * into v_seq
  from public.fiscal_sequences
  where company_id = v_company_id
  and sequence_type = p_sequence_type
  and is_active = true
  for update;
  
  if v_seq is null then
    -- Crear secuencia si no existe
    insert into public.fiscal_sequences (company_id, sequence_type, prefix, current_number, control_prefix, control_current)
    values (v_company_id, p_sequence_type, 
      case p_sequence_type
        when 'invoice' then 'FAC-'
        when 'credit_note' then 'NC-'
        when 'debit_note' then 'ND-'
      end,
      0, '00-', 0)
    returning * into v_seq;
  end if;
  
  -- Incrementar números
  update public.fiscal_sequences
  set current_number = current_number + 1,
      control_current = control_current + 1
  where id = v_seq.id;
  
  -- Formatear números
  v_invoice_number := v_seq.prefix || lpad((v_seq.current_number + 1)::text, 8, '0');
  v_control_number := v_seq.control_prefix || lpad((v_seq.control_current + 1)::text, 8, '0');
  
  return json_build_object(
    'success', true,
    'invoice_number', v_invoice_number,
    'control_number', v_control_number
  );
end;
$$;

-- =====================================================
-- 8. Función: Emitir Factura
-- =====================================================
create or replace function public.issue_invoice(
  p_invoice_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_invoice record;
  v_numbers json;
  v_entry_id uuid;
  v_ar_account_id uuid;  -- Cuentas por Cobrar
  v_sales_account_id uuid;  -- Ventas
  v_tax_account_id uuid;  -- IVA por Pagar
begin
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No hay empresa activa');
  end if;
  
  -- Obtener factura
  select * into v_invoice
  from public.invoices
  where id = p_invoice_id
  and company_id = v_company_id;
  
  if v_invoice is null then
    return json_build_object('success', false, 'error', 'Factura no encontrada');
  end if;
  
  if v_invoice.status != 'draft' then
    return json_build_object('success', false, 'error', 'Solo se pueden emitir facturas en borrador');
  end if;
  
  if v_invoice.total <= 0 then
    return json_build_object('success', false, 'error', 'La factura debe tener un monto mayor a cero');
  end if;
  
  -- Obtener números fiscales
  v_numbers := public.get_next_fiscal_number('invoice');
  
  if not (v_numbers->>'success')::boolean then
    return v_numbers;
  end if;
  
  -- Buscar cuentas contables (básicas)
  select id into v_ar_account_id 
  from public.chart_of_accounts 
  where company_id = v_company_id and code like '1.1.03%' limit 1;  -- Cuentas por Cobrar
  
  select id into v_sales_account_id 
  from public.chart_of_accounts 
  where company_id = v_company_id and code like '4.1%' limit 1;  -- Ventas
  
  select id into v_tax_account_id 
  from public.chart_of_accounts 
  where company_id = v_company_id and code like '2.1.02%' limit 1;  -- Impuestos por Pagar
  
  -- Crear asiento contable si hay cuentas configuradas
  if v_ar_account_id is not null and v_sales_account_id is not null then
    insert into public.journal_entries (company_id, entry_date, description, reference, status, created_by)
    values (v_company_id, v_invoice.invoice_date, 
      'Factura ' || (v_numbers->>'invoice_number'), 
      v_numbers->>'control_number', 
      'posted', auth.uid())
    returning id into v_entry_id;
    
    -- Débito: Cuentas por Cobrar (total)
    insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    values (v_entry_id, v_ar_account_id, 'Cliente - Factura', v_invoice.total, 0);
    
    -- Crédito: Ventas (subtotal)
    insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    values (v_entry_id, v_sales_account_id, 'Ingresos por Ventas', 0, v_invoice.subtotal);
    
    -- Crédito: IVA por Pagar (impuesto)
    if v_tax_account_id is not null and v_invoice.tax_amount > 0 then
      insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_tax_account_id, 'IVA Débito Fiscal', 0, v_invoice.tax_amount);
    end if;
  end if;
  
  -- Actualizar factura
  update public.invoices
  set status = 'issued',
      invoice_number = v_numbers->>'invoice_number',
      control_number = v_numbers->>'control_number',
      journal_entry_id = v_entry_id,
      issued_at = now(),
      issued_by = auth.uid(),
      updated_at = now()
  where id = p_invoice_id;
  
  return json_build_object(
    'success', true,
    'invoice_number', v_numbers->>'invoice_number',
    'control_number', v_numbers->>'control_number',
    'journal_entry_id', v_entry_id,
    'message', 'Factura emitida correctamente'
  );
end;
$$;

-- =====================================================
-- 9. Función: Crear Nota de Crédito
-- =====================================================
create or replace function public.create_credit_note(
  p_invoice_id uuid,
  p_reason text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_invoice record;
  v_numbers json;
  v_note_id uuid;
  v_entry_id uuid;
  v_ar_account_id uuid;
  v_sales_account_id uuid;
  v_tax_account_id uuid;
begin
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No hay empresa activa');
  end if;
  
  -- Obtener factura
  select * into v_invoice
  from public.invoices
  where id = p_invoice_id
  and company_id = v_company_id;
  
  if v_invoice is null then
    return json_build_object('success', false, 'error', 'Factura no encontrada');
  end if;
  
  if v_invoice.status != 'issued' then
    return json_build_object('success', false, 'error', 'Solo se pueden anular facturas emitidas');
  end if;
  
  -- Obtener números de nota de crédito
  v_numbers := public.get_next_fiscal_number('credit_note');
  
  if not (v_numbers->>'success')::boolean then
    return v_numbers;
  end if;
  
  -- Buscar cuentas contables
  select id into v_ar_account_id 
  from public.chart_of_accounts 
  where company_id = v_company_id and code like '1.1.03%' limit 1;
  
  select id into v_sales_account_id 
  from public.chart_of_accounts 
  where company_id = v_company_id and code like '4.1%' limit 1;
  
  select id into v_tax_account_id 
  from public.chart_of_accounts 
  where company_id = v_company_id and code like '2.1.02%' limit 1;
  
  -- Crear asiento contable inverso
  if v_ar_account_id is not null and v_sales_account_id is not null then
    insert into public.journal_entries (company_id, entry_date, description, reference, status, created_by)
    values (v_company_id, current_date, 
      'Nota de Crédito ' || (v_numbers->>'invoice_number') || ' - Anula ' || v_invoice.invoice_number, 
      v_numbers->>'control_number', 
      'posted', auth.uid())
    returning id into v_entry_id;
    
    -- Invertir asiento: Crédito a Cuentas por Cobrar
    insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    values (v_entry_id, v_ar_account_id, 'Anulación - Cliente', 0, v_invoice.total);
    
    -- Invertir: Débito a Ventas
    insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    values (v_entry_id, v_sales_account_id, 'Anulación - Ingresos', v_invoice.subtotal, 0);
    
    -- Invertir: Débito a IVA
    if v_tax_account_id is not null and v_invoice.tax_amount > 0 then
      insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_tax_account_id, 'Anulación - IVA', v_invoice.tax_amount, 0);
    end if;
  end if;
  
  -- Crear nota de crédito
  insert into public.credit_notes (company_id, invoice_id, note_number, control_number, note_date, reason, subtotal, tax_amount, total, journal_entry_id, created_by)
  values (v_company_id, p_invoice_id, v_numbers->>'invoice_number', v_numbers->>'control_number', current_date, p_reason, v_invoice.subtotal, v_invoice.tax_amount, v_invoice.total, v_entry_id, auth.uid())
  returning id into v_note_id;
  
  -- Marcar factura como anulada
  update public.invoices
  set status = 'cancelled',
      updated_at = now()
  where id = p_invoice_id;
  
  return json_build_object(
    'success', true,
    'credit_note_id', v_note_id,
    'note_number', v_numbers->>'invoice_number',
    'message', 'Factura anulada con Nota de Crédito'
  );
end;
$$;

-- =====================================================
-- 10. Función: Calcular totales de factura
-- =====================================================
create or replace function public.recalculate_invoice_totals(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subtotal numeric;
  v_tax numeric;
  v_total numeric;
begin
  select 
    coalesce(sum(line_subtotal), 0),
    coalesce(sum(tax_amount), 0),
    coalesce(sum(line_total), 0)
  into v_subtotal, v_tax, v_total
  from public.invoice_lines
  where invoice_id = p_invoice_id;
  
  update public.invoices
  set subtotal = v_subtotal,
      tax_amount = v_tax,
      total = v_total,
      updated_at = now()
  where id = p_invoice_id;
end;
$$;

-- Trigger para recalcular totales
create or replace function public.trigger_recalculate_invoice()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'DELETE' then
    perform public.recalculate_invoice_totals(OLD.invoice_id);
    return OLD;
  else
    -- Calcular línea antes de insertar/actualizar
    NEW.line_subtotal := NEW.quantity * NEW.unit_price;
    NEW.tax_amount := NEW.line_subtotal * (NEW.tax_rate / 100);
    NEW.line_total := NEW.line_subtotal + NEW.tax_amount;
    
    perform public.recalculate_invoice_totals(NEW.invoice_id);
    return NEW;
  end if;
end;
$$;

create trigger on_invoice_line_change
  after insert or update or delete on public.invoice_lines
  for each row execute function public.trigger_recalculate_invoice();

-- =====================================================
-- 11. Función: Crear perfiles de impuesto por defecto
-- =====================================================
create or replace function public.create_default_tax_profiles()
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
    return json_build_object('success', false, 'error', 'No hay empresa activa');
  end if;
  
  -- Verificar que no existan
  if exists (select 1 from public.tax_profiles where company_id = v_company_id) then
    return json_build_object('success', false, 'error', 'Ya existen perfiles de impuesto');
  end if;
  
  -- IVA General (16%)
  insert into public.tax_profiles (company_id, name, rate, is_default)
  values (v_company_id, 'IVA General', 16.00, true);
  
  -- Exento (0%)
  insert into public.tax_profiles (company_id, name, rate, is_default)
  values (v_company_id, 'Exento', 0.00, false);
  
  -- Reducido (8%)
  insert into public.tax_profiles (company_id, name, rate, is_default)
  values (v_company_id, 'IVA Reducido', 8.00, false);
  
  -- Suntuario (adicional)
  insert into public.tax_profiles (company_id, name, rate, is_default)
  values (v_company_id, 'IVA + Suntuario', 31.00, false);
  
  select count(*) into v_count from public.tax_profiles where company_id = v_company_id;
  
  return json_build_object(
    'success', true,
    'count', v_count,
    'message', 'Perfiles de impuesto creados'
  );
end;
$$;

-- =====================================================
-- 12. Índices para performance
-- =====================================================
create index if not exists idx_customers_company on public.customers(company_id);
create index if not exists idx_customers_rif on public.customers(rif);
create index if not exists idx_invoices_company on public.invoices(company_id);
create index if not exists idx_invoices_customer on public.invoices(customer_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_date on public.invoices(invoice_date);
create index if not exists idx_invoice_lines_invoice on public.invoice_lines(invoice_id);
create index if not exists idx_credit_notes_invoice on public.credit_notes(invoice_id);
