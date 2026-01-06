-- =====================================================
-- FASE 7: Bancos
-- Sistema Administrativo YOT
-- =====================================================

-- =====================================================
-- 1. Cuentas Bancarias (Bank Accounts)
-- =====================================================
create table if not exists public.bank_accounts (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  
  -- Identificación
  code text not null,
  bank_name text not null,
  account_number text not null,
  account_type text default 'checking' check (account_type in ('checking', 'savings', 'credit')),
  currency text default 'USD' not null,
  
  -- Vinculación contable
  chart_account_id uuid references public.chart_of_accounts,
  
  -- Balances
  initial_balance numeric(15, 2) default 0 not null,
  current_balance numeric(15, 2) default 0 not null,
  
  -- Estados
  is_active boolean default true,
  notes text,
  
  -- Auditoría
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_bank_account_code_per_company unique (company_id, code)
);

alter table public.bank_accounts enable row level security;

create policy "Users can view bank accounts"
  on public.bank_accounts for select
  using (company_id = public.get_active_company_id());

create policy "Admins can manage bank accounts"
  on public.bank_accounts for all
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
-- 2. Transacciones Bancarias (Bank Transactions)
-- =====================================================
create table if not exists public.bank_transactions (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  bank_account_id uuid references public.bank_accounts on delete restrict not null,
  
  -- Tipo de transacción
  transaction_type text not null check (transaction_type in ('deposit', 'withdrawal', 'transfer')),
  
  -- Detalles
  amount numeric(15, 2) not null check (amount > 0),
  transaction_date date not null,
  reference text,
  description text not null,
  
  -- Para transferencias
  destination_account_id uuid references public.bank_accounts,
  
  -- Estado de conciliación
  status text default 'pending' check (status in ('pending', 'reconciled')),
  reconciliation_id uuid,  -- FK se agregará después
  
  -- Vinculación contable
  journal_entry_id uuid references public.journal_entries,
  
  -- Auditoría
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.bank_transactions enable row level security;

create policy "Users can view bank transactions"
  on public.bank_transactions for select
  using (company_id = public.get_active_company_id());

create policy "Users can create bank transactions"
  on public.bank_transactions for insert
  with check (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant', 'member')
    )
  );

create policy "Admins can update reconciled transactions"
  on public.bank_transactions for update
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
-- 3. Conciliaciones Bancarias (Bank Reconciliations)
-- =====================================================
create table if not exists public.bank_reconciliations (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  bank_account_id uuid references public.bank_accounts on delete restrict not null,
  
  -- Período
  reconciliation_date date not null,
  start_date date not null,
  end_date date not null,
  
  -- Balances
  balance_per_books numeric(15, 2) not null,
  balance_per_bank numeric(15, 2) not null,
  difference numeric(15, 2) generated always as (balance_per_bank - balance_per_books) stored,
  
  -- Notas y ajustes
  notes text,
  adjustments jsonb,
  
  -- Estado
  status text default 'in_progress' check (status in ('in_progress', 'completed')),
  
  -- Auditoría
  reconciled_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

alter table public.bank_reconciliations enable row level security;

create policy "Users can view reconciliations"
  on public.bank_reconciliations for select
  using (company_id = public.get_active_company_id());

create policy "Accountants can manage reconciliations"
  on public.bank_reconciliations for all
  using (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant')
    )
  );

-- Agregar foreign key de reconciliation_id ahora que la tabla bank_reconciliations existe
alter table public.bank_transactions
  add constraint fk_bank_transactions_reconciliation
  foreign key (reconciliation_id)
  references public.bank_reconciliations(id);

-- =====================================================
-- 4. Función: Registrar Transacción Bancaria
-- Con asiento contable automático
-- =====================================================
create or replace function public.register_bank_transaction(
  p_bank_account_id uuid,
  p_transaction_type text,
  p_amount numeric,
  p_transaction_date date,
  p_description text,
  p_reference text default null,
  p_destination_account_id uuid default null,
  p_counterpart_account_id uuid default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_bank_account record;
  v_dest_account record;
  v_transaction_id uuid;
  v_entry_id uuid;
  v_new_balance numeric;
begin
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No hay empresa activa');
  end if;
  
  if p_amount <= 0 then
    return json_build_object('success', false, 'error', 'El monto debe ser mayor a cero');
  end if;
  
  -- Obtener cuenta bancaria origen
  select * into v_bank_account
  from public.bank_accounts
  where id = p_bank_account_id and company_id = v_company_id;
  
  if v_bank_account is null then
    return json_build_object('success', false, 'error', 'Cuenta bancaria no encontrada');
  end if;
  
  -- Validar cuenta contable vinculada
  if v_bank_account.chart_account_id is null then
    return json_build_object('success', false, 'error', 'La cuenta bancaria no está vinculada a una cuenta contable');
  end if;
  
  -- Para transferencias, validar cuenta destino
  if p_transaction_type = 'transfer' then
    if p_destination_account_id is null then
      return json_build_object('success', false, 'error', 'Debe especificar cuenta destino para transferencia');
    end if;
    
    select * into v_dest_account
    from public.bank_accounts
    where id = p_destination_account_id and company_id = v_company_id;
    
    if v_dest_account is null then
      return json_build_object('success', false, 'error', 'Cuenta destino no encontrada');
    end if;
    
    if v_dest_account.chart_account_id is null then
      return json_build_object('success', false, 'error', 'La cuenta destino no está vinculada a una cuenta contable');
    end if;
  end if;
  
  -- Crear transacción bancaria
  insert into public.bank_transactions (
    company_id, bank_account_id, transaction_type, amount, 
    transaction_date, description, reference, destination_account_id,
    status, created_by
  )
  values (
    v_company_id, p_bank_account_id, p_transaction_type, p_amount,
    p_transaction_date, p_description, p_reference, p_destination_account_id,
    'pending', auth.uid()
  )
  returning id into v_transaction_id;
  
  -- Actualizar balance de cuenta origen
  case p_transaction_type
    when 'deposit' then
      v_new_balance := v_bank_account.current_balance + p_amount;
    when 'withdrawal' then
      v_new_balance := v_bank_account.current_balance - p_amount;
    when 'transfer' then
      v_new_balance := v_bank_account.current_balance - p_amount;
  end case;
  
  update public.bank_accounts
  set current_balance = v_new_balance, updated_at = now()
  where id = p_bank_account_id;
  
  -- Para transferencias, actualizar balance de cuenta destino
  if p_transaction_type = 'transfer' then
    update public.bank_accounts
    set current_balance = current_balance + p_amount, updated_at = now()
    where id = p_destination_account_id;
  end if;
  
  -- Crear asiento contable
  insert into public.journal_entries (
    company_id, entry_date, description, reference, status, created_by
  )
  values (
    v_company_id, p_transaction_date,
    p_description,
    coalesce(p_reference, 'BANK-' || v_transaction_id::text),
    'posted', auth.uid()
  )
  returning id into v_entry_id;
  
  -- Líneas del asiento según tipo
  case p_transaction_type
    when 'deposit' then
      -- Débito: Banco
      insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_bank_account.chart_account_id, p_description, p_amount, 0);
      
      -- Crédito: Cuenta de contrapartida (ingreso o cobro)
      if p_counterpart_account_id is not null then
        insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
        values (v_entry_id, p_counterpart_account_id, p_description, 0, p_amount);
      end if;
      
    when 'withdrawal' then
      -- Débito: Cuenta de contrapartida (gasto o pago)
      if p_counterpart_account_id is not null then
        insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
        values (v_entry_id, p_counterpart_account_id, p_description, p_amount, 0);
      end if;
      
      -- Crédito: Banco
      insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_bank_account.chart_account_id, p_description, 0, p_amount);
      
    when 'transfer' then
      -- Débito: Banco destino
      insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_dest_account.chart_account_id, 'Transferencia recibida', p_amount, 0);
      
      -- Crédito: Banco origen
      insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_bank_account.chart_account_id, 'Transferencia enviada', 0, p_amount);
  end case;
  
  -- Vincular asiento a transacción
  update public.bank_transactions
  set journal_entry_id = v_entry_id
  where id = v_transaction_id;
  
  return json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'journal_entry_id', v_entry_id,
    'new_balance', v_new_balance,
    'message', 'Transacción registrada exitosamente'
  );
end;
$$;

-- =====================================================
-- 5. Función: Conciliar Banco
-- =====================================================
create or replace function public.reconcile_bank(
  p_bank_account_id uuid,
  p_reconciliation_date date,
  p_start_date date,
  p_end_date date,
  p_balance_per_bank numeric,
  p_transaction_ids uuid[],
  p_notes text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_reconciliation_id uuid;
  v_balance_per_books numeric;
  v_transaction_id uuid;
begin
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No hay empresa activa');
  end if;
  
  -- Calcular balance según libros
  select current_balance into v_balance_per_books
  from public.bank_accounts
  where id = p_bank_account_id and company_id = v_company_id;
  
  if v_balance_per_books is null then
    return json_build_object('success', false, 'error', 'Cuenta bancaria no encontrada');
  end if;
  
  -- Crear conciliación
  insert into public.bank_reconciliations (
    company_id, bank_account_id, reconciliation_date,
    start_date, end_date, balance_per_books, balance_per_bank,
    notes, status, reconciled_by
  )
  values (
    v_company_id, p_bank_account_id, p_reconciliation_date,
    p_start_date, p_end_date, v_balance_per_books, p_balance_per_bank,
    p_notes, 'completed', auth.uid()
  )
  returning id into v_reconciliation_id;
  
  -- Marcar transacciones como conciliadas
  if p_transaction_ids is not null and array_length(p_transaction_ids, 1) > 0 then
    foreach v_transaction_id in array p_transaction_ids
    loop
      update public.bank_transactions
      set status = 'reconciled',
          reconciliation_id = v_reconciliation_id,
          updated_at = now()
      where id = v_transaction_id
      and company_id = v_company_id
      and bank_account_id = p_bank_account_id
      and status = 'pending';
    end loop;
  end if;
  
  -- Completar conciliación
  update public.bank_reconciliations
  set completed_at = now()
  where id = v_reconciliation_id;
  
  return json_build_object(
    'success', true,
    'reconciliation_id', v_reconciliation_id,
    'balance_per_books', v_balance_per_books,
    'balance_per_bank', p_balance_per_bank,
    'difference', p_balance_per_bank - v_balance_per_books,
    'transactions_reconciled', array_length(p_transaction_ids, 1),
    'message', 'Conciliación completada'
  );
end;
$$;

-- =====================================================
-- 6. Índices para performance
-- =====================================================
create index if not exists idx_bank_accounts_company on public.bank_accounts(company_id);
create index if not exists idx_bank_accounts_active on public.bank_accounts(is_active) where is_active = true;

create index if not exists idx_bank_transactions_company on public.bank_transactions(company_id);
create index if not exists idx_bank_transactions_account on public.bank_transactions(bank_account_id);
create index if not exists idx_bank_transactions_date on public.bank_transactions(transaction_date);
create index if not exists idx_bank_transactions_status on public.bank_transactions(status);

create index if not exists idx_bank_reconciliations_company on public.bank_reconciliations(company_id);
create index if not exists idx_bank_reconciliations_account on public.bank_reconciliations(bank_account_id);
create index if not exists idx_bank_reconciliations_date on public.bank_reconciliations(reconciliation_date);
