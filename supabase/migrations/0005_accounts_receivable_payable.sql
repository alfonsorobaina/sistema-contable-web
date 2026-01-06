-- =====================================================
-- FASE 5: Cuentas por Cobrar / Pagar (CxC/CxP)
-- Sistema Administrativo YOT
-- =====================================================

-- =====================================================
-- 1. Proveedores (Suppliers)
-- Estructura igual a customers para consistencia
-- =====================================================
create table if not exists public.suppliers (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  
  -- Identificación fiscal (RIF Venezuela)
  rif text not null,
  rif_type text not null check (rif_type in ('J', 'V', 'G', 'E', 'P', 'C')),
  
  -- Datos básicos
  name text not null,
  trade_name text,
  
  -- Contacto
  address text,
  city text,
  state text,
  phone text,
  email text,
  
  -- Datos bancarios para pagos
  bank_name text,
  bank_account text,
  bank_account_type text check (bank_account_type in ('corriente', 'ahorro')),
  
  -- Control
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_supplier_rif_per_company unique (company_id, rif)
);

alter table public.suppliers enable row level security;

create policy "Users can view suppliers of their active company"
  on public.suppliers for select
  using (company_id = public.get_active_company_id());

create policy "Users can insert suppliers"
  on public.suppliers for insert
  with check (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant', 'member')
    )
  );

create policy "Users can update suppliers"
  on public.suppliers for update
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
-- 2. Facturas de Compra (Bills)
-- Documentos de proveedores que debemos pagar
-- =====================================================
create table if not exists public.bills (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  supplier_id uuid references public.suppliers on delete restrict not null,
  
  -- Número de factura del proveedor
  bill_number text not null,
  
  -- Fechas
  bill_date date not null,
  due_date date,
  
  -- Estado
  status text default 'pending' not null check (status in ('pending', 'partial', 'paid', 'cancelled')),
  
  -- Montos
  subtotal numeric(15, 2) default 0 not null,
  tax_amount numeric(15, 2) default 0 not null,
  total numeric(15, 2) default 0 not null,
  
  -- Pagos y saldo
  amount_paid numeric(15, 2) default 0 not null,
  balance numeric(15, 2) generated always as (total - amount_paid) stored,
  
  -- Moneda
  currency text default 'VES' not null,
  exchange_rate numeric(15, 4) default 1 not null,
  
  -- Notas
  notes text,
  
  -- Asiento contable
  journal_entry_id uuid references public.journal_entries,
  
  -- Auditoría
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_bill_per_supplier unique (company_id, supplier_id, bill_number)
);

alter table public.bills enable row level security;

create policy "Users can view bills of their active company"
  on public.bills for select
  using (company_id = public.get_active_company_id());

create policy "Users can insert bills"
  on public.bills for insert
  with check (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant')
    )
  );

create policy "Users can update pending bills"
  on public.bills for update
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
-- 3. Líneas de Factura de Compra (Bill Lines)
-- =====================================================
create table if not exists public.bill_lines (
  id uuid default gen_random_uuid() primary key,
  bill_id uuid references public.bills on delete cascade not null,
  
  description text not null,
  quantity numeric(10, 2) default 1 not null check (quantity > 0),
  unit_price numeric(15, 2) not null check (unit_price >= 0),
  
  tax_rate numeric(5, 2) default 0 not null,
  tax_amount numeric(15, 2) default 0 not null,
  line_subtotal numeric(15, 2) default 0 not null,
  line_total numeric(15, 2) default 0 not null,
  
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.bill_lines enable row level security;

create policy "Users can view bill lines"
  on public.bill_lines for select
  using (
    exists (
      select 1 from public.bills b
      where b.id = bill_lines.bill_id
      and b.company_id = public.get_active_company_id()
    )
  );

create policy "Users can manage bill lines"
  on public.bill_lines for all
  using (
    exists (
      select 1 from public.bills b
      where b.id = bill_lines.bill_id
      and b.company_id = public.get_active_company_id()
    )
  );

-- Trigger para calcular totales de bill
create or replace function public.trigger_recalculate_bill()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'DELETE' then
    update public.bills
    set subtotal = coalesce((select sum(line_subtotal) from public.bill_lines where bill_id = OLD.bill_id), 0),
        tax_amount = coalesce((select sum(tax_amount) from public.bill_lines where bill_id = OLD.bill_id), 0),
        total = coalesce((select sum(line_total) from public.bill_lines where bill_id = OLD.bill_id), 0),
        updated_at = now()
    where id = OLD.bill_id;
    return OLD;
  else
    NEW.line_subtotal := NEW.quantity * NEW.unit_price;
    NEW.tax_amount := NEW.line_subtotal * (NEW.tax_rate / 100);
    NEW.line_total := NEW.line_subtotal + NEW.tax_amount;
    
    -- Update bill totals after this insert/update
    perform pg_notify('recalculate_bill', NEW.bill_id::text);
    return NEW;
  end if;
end;
$$;

create trigger on_bill_line_change
  before insert or update on public.bill_lines
  for each row execute function public.trigger_recalculate_bill();

-- =====================================================
-- 4. Pagos (Payments)
-- Cobros de clientes y pagos a proveedores
-- =====================================================
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  
  -- Tipo: cobro (income) o pago (expense)
  payment_type text not null check (payment_type in ('income', 'expense')),
  
  -- Datos del pago
  payment_date date not null,
  payment_method text not null check (payment_method in ('cash', 'transfer', 'check', 'card', 'mobile')),
  
  -- Monto
  amount numeric(15, 2) not null check (amount > 0),
  currency text default 'VES' not null,
  exchange_rate numeric(15, 4) default 1 not null,
  
  -- Referencia bancaria
  reference text,
  bank_reference text,
  
  -- Descripción
  description text,
  
  -- Asiento contable
  journal_entry_id uuid references public.journal_entries,
  
  -- Auditoría
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payments enable row level security;

create policy "Users can view payments of their active company"
  on public.payments for select
  using (company_id = public.get_active_company_id());

create policy "Users can create payments"
  on public.payments for insert
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
-- 5. Aplicación de Pagos (Payment Allocations)
-- Vincula pagos con facturas/bills
-- =====================================================
create table if not exists public.payment_allocations (
  id uuid default gen_random_uuid() primary key,
  payment_id uuid references public.payments on delete cascade not null,
  
  -- Tipo de documento
  document_type text not null check (document_type in ('invoice', 'bill')),
  document_id uuid not null,  -- invoice.id o bill.id
  
  -- Monto aplicado
  amount_applied numeric(15, 2) not null check (amount_applied > 0),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payment_allocations enable row level security;

create policy "Users can view payment allocations"
  on public.payment_allocations for select
  using (
    exists (
      select 1 from public.payments p
      where p.id = payment_allocations.payment_id
      and p.company_id = public.get_active_company_id()
    )
  );

-- =====================================================
-- 6. Agregar saldo pendiente a invoices
-- =====================================================
alter table public.invoices 
add column if not exists amount_paid numeric(15, 2) default 0 not null;

-- No podemos usar generated column si la tabla ya existe, usar trigger
create or replace function public.update_invoice_balance()
returns trigger
language plpgsql
as $$
begin
  -- Recalcular amount_paid basado en allocations
  update public.invoices
  set amount_paid = coalesce((
    select sum(pa.amount_applied) 
    from public.payment_allocations pa 
    where pa.document_type = 'invoice' 
    and pa.document_id = NEW.document_id
  ), 0)
  where id = NEW.document_id
  and NEW.document_type = 'invoice';
  
  -- Actualizar status según saldo
  update public.invoices
  set status = case 
    when amount_paid >= total then 'paid'
    when amount_paid > 0 then 'issued'  -- parcialmente pagada sigue como issued
    else status
  end
  where id = NEW.document_id
  and NEW.document_type = 'invoice';
  
  return NEW;
end;
$$;

create trigger on_payment_allocation_invoice
  after insert on public.payment_allocations
  for each row
  when (NEW.document_type = 'invoice')
  execute function public.update_invoice_balance();

-- =====================================================
-- 7. Trigger para actualizar saldo de bills
-- =====================================================
create or replace function public.update_bill_balance()
returns trigger
language plpgsql
as $$
begin
  -- Recalcular amount_paid
  update public.bills
  set amount_paid = coalesce((
    select sum(pa.amount_applied) 
    from public.payment_allocations pa 
    where pa.document_type = 'bill' 
    and pa.document_id = NEW.document_id
  ), 0),
  updated_at = now()
  where id = NEW.document_id
  and NEW.document_type = 'bill';
  
  -- Actualizar status según saldo
  update public.bills
  set status = case 
    when amount_paid >= total then 'paid'
    when amount_paid > 0 then 'partial'
    else 'pending'
  end
  where id = NEW.document_id
  and NEW.document_type = 'bill';
  
  return NEW;
end;
$$;

create trigger on_payment_allocation_bill
  after insert on public.payment_allocations
  for each row
  when (NEW.document_type = 'bill')
  execute function public.update_bill_balance();

-- =====================================================
-- 8. Función: Registrar Pago
-- =====================================================
create or replace function public.register_payment(
  p_payment_type text,  -- 'income' o 'expense'
  p_payment_date date,
  p_payment_method text,
  p_amount numeric,
  p_reference text,
  p_description text,
  p_allocations jsonb  -- [{"document_type": "invoice", "document_id": "uuid", "amount": 100}]
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_payment_id uuid;
  v_entry_id uuid;
  v_allocation record;
  v_total_allocated numeric := 0;
  v_cash_account_id uuid;
  v_ar_account_id uuid;
  v_ap_account_id uuid;
begin
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No hay empresa activa');
  end if;
  
  -- Validar que las allocations sumen el monto del pago
  for v_allocation in select * from jsonb_array_elements(p_allocations)
  loop
    v_total_allocated := v_total_allocated + (v_allocation.value->>'amount')::numeric;
  end loop;
  
  if v_total_allocated != p_amount then
    return json_build_object('success', false, 'error', 'El monto aplicado (' || v_total_allocated || ') no coincide con el pago (' || p_amount || ')');
  end if;
  
  -- Buscar cuentas contables
  select id into v_cash_account_id 
  from public.chart_of_accounts 
  where company_id = v_company_id and code like '1.1.01%' limit 1;  -- Caja/Banco
  
  select id into v_ar_account_id 
  from public.chart_of_accounts 
  where company_id = v_company_id and code like '1.1.03%' limit 1;  -- CxC
  
  select id into v_ap_account_id 
  from public.chart_of_accounts 
  where company_id = v_company_id and code like '2.1.01%' limit 1;  -- CxP
  
  -- Crear asiento contable
  insert into public.journal_entries (company_id, entry_date, description, reference, status, created_by)
  values (v_company_id, p_payment_date, 
    case p_payment_type 
      when 'income' then 'Cobro: ' || coalesce(p_description, p_reference)
      else 'Pago: ' || coalesce(p_description, p_reference)
    end,
    p_reference, 'posted', auth.uid())
  returning id into v_entry_id;
  
  if p_payment_type = 'income' then
    -- Cobro: Débito Caja, Crédito CxC
    if v_cash_account_id is not null then
      insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_cash_account_id, 'Cobro recibido', p_amount, 0);
    end if;
    if v_ar_account_id is not null then
      insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_ar_account_id, 'Aplicación a CxC', 0, p_amount);
    end if;
  else
    -- Pago: Débito CxP, Crédito Caja
    if v_ap_account_id is not null then
      insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_ap_account_id, 'Pago a proveedor', p_amount, 0);
    end if;
    if v_cash_account_id is not null then
      insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_cash_account_id, 'Desembolso', 0, p_amount);
    end if;
  end if;
  
  -- Crear pago
  insert into public.payments (company_id, payment_type, payment_date, payment_method, amount, reference, description, journal_entry_id, created_by)
  values (v_company_id, p_payment_type, p_payment_date, p_payment_method, p_amount, p_reference, p_description, v_entry_id, auth.uid())
  returning id into v_payment_id;
  
  -- Crear allocations
  for v_allocation in select * from jsonb_array_elements(p_allocations)
  loop
    insert into public.payment_allocations (payment_id, document_type, document_id, amount_applied)
    values (
      v_payment_id, 
      v_allocation.value->>'document_type',
      (v_allocation.value->>'document_id')::uuid,
      (v_allocation.value->>'amount')::numeric
    );
  end loop;
  
  return json_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'journal_entry_id', v_entry_id,
    'message', case p_payment_type when 'income' then 'Cobro registrado' else 'Pago registrado' end
  );
end;
$$;

-- =====================================================
-- 9. Función: Reporte de Antigüedad
-- =====================================================
create or replace function public.get_aging_report(
  p_report_type text,  -- 'receivable' o 'payable'
  p_as_of_date date default current_date
)
returns table (
  entity_id uuid,
  entity_name text,
  entity_rif text,
  current_amount numeric,
  days_1_30 numeric,
  days_31_60 numeric,
  days_61_90 numeric,
  days_over_90 numeric,
  total_balance numeric
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
  
  if p_report_type = 'receivable' then
    -- Cuentas por Cobrar (facturas de venta)
    return query
    select 
      c.id as entity_id,
      c.name as entity_name,
      c.rif as entity_rif,
      coalesce(sum(case when p_as_of_date - i.invoice_date <= 0 then i.total - i.amount_paid else 0 end), 0) as current_amount,
      coalesce(sum(case when p_as_of_date - i.invoice_date between 1 and 30 then i.total - i.amount_paid else 0 end), 0) as days_1_30,
      coalesce(sum(case when p_as_of_date - i.invoice_date between 31 and 60 then i.total - i.amount_paid else 0 end), 0) as days_31_60,
      coalesce(sum(case when p_as_of_date - i.invoice_date between 61 and 90 then i.total - i.amount_paid else 0 end), 0) as days_61_90,
      coalesce(sum(case when p_as_of_date - i.invoice_date > 90 then i.total - i.amount_paid else 0 end), 0) as days_over_90,
      coalesce(sum(i.total - i.amount_paid), 0) as total_balance
    from public.customers c
    left join public.invoices i on i.customer_id = c.id
      and i.status in ('issued', 'partial')
      and i.company_id = v_company_id
    where c.company_id = v_company_id
    group by c.id, c.name, c.rif
    having coalesce(sum(i.total - i.amount_paid), 0) > 0
    order by total_balance desc;
  else
    -- Cuentas por Pagar (facturas de compra)
    return query
    select 
      s.id as entity_id,
      s.name as entity_name,
      s.rif as entity_rif,
      coalesce(sum(case when p_as_of_date - b.bill_date <= 0 then b.total - b.amount_paid else 0 end), 0) as current_amount,
      coalesce(sum(case when p_as_of_date - b.bill_date between 1 and 30 then b.total - b.amount_paid else 0 end), 0) as days_1_30,
      coalesce(sum(case when p_as_of_date - b.bill_date between 31 and 60 then b.total - b.amount_paid else 0 end), 0) as days_31_60,
      coalesce(sum(case when p_as_of_date - b.bill_date between 61 and 90 then b.total - b.amount_paid else 0 end), 0) as days_61_90,
      coalesce(sum(case when p_as_of_date - b.bill_date > 90 then b.total - b.amount_paid else 0 end), 0) as days_over_90,
      coalesce(sum(b.total - b.amount_paid), 0) as total_balance
    from public.suppliers s
    left join public.bills b on b.supplier_id = s.id
      and b.status in ('pending', 'partial')
      and b.company_id = v_company_id
    where s.company_id = v_company_id
    group by s.id, s.name, s.rif
    having coalesce(sum(b.total - b.amount_paid), 0) > 0
    order by total_balance desc;
  end if;
end;
$$;

-- =====================================================
-- 10. Índices para performance
-- =====================================================
create index if not exists idx_suppliers_company on public.suppliers(company_id);
create index if not exists idx_suppliers_rif on public.suppliers(rif);
create index if not exists idx_bills_company on public.bills(company_id);
create index if not exists idx_bills_supplier on public.bills(supplier_id);
create index if not exists idx_bills_status on public.bills(status);
create index if not exists idx_bills_date on public.bills(bill_date);
create index if not exists idx_bill_lines_bill on public.bill_lines(bill_id);
create index if not exists idx_payments_company on public.payments(company_id);
create index if not exists idx_payments_type on public.payments(payment_type);
create index if not exists idx_payments_date on public.payments(payment_date);
create index if not exists idx_payment_allocations_payment on public.payment_allocations(payment_id);
create index if not exists idx_payment_allocations_document on public.payment_allocations(document_type, document_id);
