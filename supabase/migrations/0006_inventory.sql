-- =====================================================
-- FASE 6: Inventario
-- Sistema Administrativo YOT
-- =====================================================

-- =====================================================
-- 1. Productos (Products)
-- =====================================================
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  
  -- Identificación
  code text not null,
  name text not null,
  description text,
  
  -- Clasificación
  category text,
  unit_of_measure text default 'UND' not null,  -- UND, KG, LT, M, etc.
  
  -- Inventario
  is_tracked boolean default true,  -- Si maneja inventario
  cost_method text default 'average' check (cost_method in ('average', 'fifo', 'standard')),
  current_cost numeric(15, 4) default 0 not null,  -- Costo promedio actual
  
  -- Precios
  sale_price numeric(15, 2) default 0,
  
  -- Cuentas contables (opcional)
  inventory_account_id uuid references public.chart_of_accounts,
  cogs_account_id uuid references public.chart_of_accounts,  -- Cost of Goods Sold
  
  -- Control
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_product_code_per_company unique (company_id, code)
);

alter table public.products enable row level security;

create policy "Users can view products of their active company"
  on public.products for select
  using (company_id = public.get_active_company_id());

create policy "Users can manage products"
  on public.products for all
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
-- 2. Almacenes (Warehouses)
-- =====================================================
create table if not exists public.warehouses (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  
  code text not null,
  name text not null,
  location text,
  
  is_active boolean default true,
  is_default boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_warehouse_code_per_company unique (company_id, code)
);

alter table public.warehouses enable row level security;

create policy "Users can view warehouses"
  on public.warehouses for select
  using (company_id = public.get_active_company_id());

create policy "Admins can manage warehouses"
  on public.warehouses for all
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
-- 3. Movimientos de Stock (Stock Moves)
-- =====================================================
create table if not exists public.stock_moves (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  product_id uuid references public.products on delete restrict not null,
  warehouse_id uuid references public.warehouses on delete restrict not null,
  
  -- Tipo de movimiento
  move_type text not null check (move_type in ('in', 'out', 'adjustment', 'transfer')),
  
  -- Cantidades
  quantity numeric(15, 4) not null check (quantity != 0),
  unit_cost numeric(15, 4) default 0 not null,  -- Costo unitario en el momento
  total_cost numeric(15, 4) generated always as (abs(quantity) * unit_cost) stored,
  
  -- Referencia
  reference text,  -- Factura, orden de compra, etc.
  notes text,
  
  -- Fecha
  move_date date not null,
  
  -- Asiento contable (opcional)
  journal_entry_id uuid references public.journal_entries,
  
  -- Auditoría
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stock_moves enable row level security;

create policy "Users can view stock moves"
  on public.stock_moves for select
  using (company_id = public.get_active_company_id());

create policy "Users can create stock moves"
  on public.stock_moves for insert
  with check (
    company_id = public.get_active_company_id()
    and exists (
      select 1 from public.company_users
      where company_id = public.get_active_company_id()
      and user_id = auth.uid()
      and role in ('admin', 'accountant', 'member')
    )
  );

-- =====================================================
-- 4. Vista: Stock Actual por Producto y Almacén
-- =====================================================
create or replace view public.product_stock as
select 
  sm.company_id,
  sm.product_id,
  sm.warehouse_id,
  p.code as product_code,
  p.name as product_name,
  w.name as warehouse_name,
  coalesce(sum(sm.quantity), 0) as quantity_on_hand,
  p.current_cost as average_cost,
  coalesce(sum(sm.quantity), 0) * p.current_cost as total_value
from public.stock_moves sm
join public.products p on p.id = sm.product_id
join public.warehouses w on w.id = sm.warehouse_id
group by sm.company_id, sm.product_id, sm.warehouse_id, p.code, p.name, w.name, p.current_cost;

-- =====================================================
-- 5. Función: Entrada de Stock (stock_in)
-- Con costeo promedio automático
-- =====================================================
create or replace function public.stock_in(
  p_product_id uuid,
  p_warehouse_id uuid,
  p_quantity numeric,
  p_unit_cost numeric,
  p_reference text default null,
  p_move_date date default current_date
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_product record;
  v_current_stock numeric;
  v_new_average_cost numeric;
  v_move_id uuid;
  v_entry_id uuid;
  v_inventory_account_id uuid;
  v_payable_account_id uuid;
begin
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No hay empresa activa');
  end if;
  
  if p_quantity <= 0 then
    return json_build_object('success', false, 'error', 'La cantidad debe ser mayor a cero');
  end if;
  
  -- Obtener producto
  select * into v_product
  from public.products
  where id = p_product_id and company_id = v_company_id;
  
  if v_product is null then
    return json_build_object('success', false, 'error', 'Producto no encontrado');
  end if;
  
  if not v_product.is_tracked then
    return json_build_object('success', false, 'error', 'Este producto no maneja inventario');
  end if;
  
  -- Obtener stock actual
  select coalesce(sum(quantity), 0) into v_current_stock
  from public.stock_moves
  where product_id = p_product_id
  and warehouse_id = p_warehouse_id;
  
  -- Calcular nuevo costo promedio
  if v_current_stock <= 0 then
    -- Si no hay stock, el nuevo costo es el costo de entrada
    v_new_average_cost := p_unit_cost;
  else
    -- Costeo promedio ponderado
    v_new_average_cost := (
      (v_current_stock * v_product.current_cost) + (p_quantity * p_unit_cost)
    ) / (v_current_stock + p_quantity);
  end if;
  
  -- Crear movimiento
  insert into public.stock_moves (
    company_id, product_id, warehouse_id, move_type, 
    quantity, unit_cost, reference, move_date, created_by
  )
  values (
    v_company_id, p_product_id, p_warehouse_id, 'in',
    p_quantity, p_unit_cost, p_reference, p_move_date, auth.uid()
  )
  returning id into v_move_id;
  
  -- Actualizar costo promedio en producto
  update public.products
  set current_cost = v_new_average_cost,
      updated_at = now()
  where id = p_product_id;
  
  -- Crear asiento contable si hay cuentas configuradas
  if v_product.inventory_account_id is not null then
    -- Buscar cuenta de CxP
    select id into v_payable_account_id
    from public.chart_of_accounts
    where company_id = v_company_id and code like '2.1.01%' limit 1;
    
    if v_payable_account_id is not null then
      insert into public.journal_entries (company_id, entry_date, description, reference, status, created_by)
      values (v_company_id, p_move_date, 
        'Entrada Inventario: ' || v_product.name,
        coalesce(p_reference, 'ENTRADA-' || v_move_id::text),
        'posted', auth.uid())
      returning id into v_entry_id;
      
      -- Débito: Inventario
      insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_product.inventory_account_id, 'Entrada de inventario', p_quantity * p_unit_cost, 0);
      
      -- Crédito: CxP (asumiendo entrada por compra)
      insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_payable_account_id, 'Por compra', 0, p_quantity * p_unit_cost);
      
      -- Vincular asiento al movimiento
      update public.stock_moves set journal_entry_id = v_entry_id where id = v_move_id;
    end if;
  end if;
  
  return json_build_object(
    'success', true,
    'move_id', v_move_id,
    'new_average_cost', v_new_average_cost,
    'message', 'Entrada de stock registrada'
  );
end;
$$;

-- =====================================================
-- 6. Función: Salida de Stock (stock_out)
-- Con validación de stock disponible
-- =====================================================
create or replace function public.stock_out(
  p_product_id uuid,
  p_warehouse_id uuid,
  p_quantity numeric,
  p_reference text default null,
  p_move_date date default current_date
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_product record;
  v_current_stock numeric;
  v_move_id uuid;
  v_entry_id uuid;
begin
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No hay empresa activa');
  end if;
  
  if p_quantity <= 0 then
    return json_build_object('success', false, 'error', 'La cantidad debe ser mayor a cero');
  end if;
  
  -- Obtener producto
  select * into v_product
  from public.products
  where id = p_product_id and company_id = v_company_id;
  
  if v_product is null then
    return json_build_object('success', false, 'error', 'Producto no encontrado');
  end if;
  
  if not v_product.is_tracked then
    return json_build_object('success', false, 'error', 'Este producto no maneja inventario');
  end if;
  
  -- Obtener stock actual
  select coalesce(sum(quantity), 0) into v_current_stock
  from public.stock_moves
  where product_id = p_product_id
  and warehouse_id = p_warehouse_id;
  
  -- VALIDACIÓN: No vender sin stock
  if v_current_stock < p_quantity then
    return json_build_object(
      'success', false, 
      'error', 'Stock insuficiente. Disponible: ' || v_current_stock || ', Solicitado: ' || p_quantity
    );
  end if;
  
  -- Crear movimiento (cantidad negativa)
  insert into public.stock_moves (
    company_id, product_id, warehouse_id, move_type, 
    quantity, unit_cost, reference, move_date, created_by
  )
  values (
    v_company_id, p_product_id, p_warehouse_id, 'out',
    -p_quantity, v_product.current_cost, p_reference, p_move_date, auth.uid()
  )
  returning id into v_move_id;
  
  -- Crear asiento contable si hay cuentas configuradas
  if v_product.inventory_account_id is not null and v_product.cogs_account_id is not null then
    insert into public.journal_entries (company_id, entry_date, description, reference, status, created_by)
    values (v_company_id, p_move_date, 
      'Salida Inventario: ' || v_product.name,
      coalesce(p_reference, 'SALIDA-' || v_move_id::text),
      'posted', auth.uid())
    returning id into v_entry_id;
    
    -- Débito: Costo de Ventas
    insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    values (v_entry_id, v_product.cogs_account_id, 'Costo de venta', p_quantity * v_product.current_cost, 0);
    
    -- Crédito: Inventario
    insert into public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    values (v_entry_id, v_product.inventory_account_id, 'Salida de inventario', 0, p_quantity * v_product.current_cost);
    
    -- Vincular asiento
    update public.stock_moves set journal_entry_id = v_entry_id where id = v_move_id;
  end if;
  
  return json_build_object(
    'success', true,
    'move_id', v_move_id,
    'unit_cost', v_product.current_cost,
    'message', 'Salida de stock registrada'
  );
end;
$$;

-- =====================================================
-- 7. Función: Consultar Stock
-- =====================================================
create or replace function public.get_stock(
  p_product_id uuid,
  p_warehouse_id uuid default null
)
returns table (
  warehouse_id uuid,
  warehouse_name text,
  quantity_on_hand numeric,
  average_cost numeric,
  total_value numeric
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
    ps.warehouse_id,
    ps.warehouse_name,
    ps.quantity_on_hand,
    ps.average_cost,
    ps.total_value
  from public.product_stock ps
  where ps.company_id = v_company_id
  and ps.product_id = p_product_id
  and (p_warehouse_id is null or ps.warehouse_id = p_warehouse_id)
  and ps.quantity_on_hand > 0;
end;
$$;

-- =====================================================
-- 8. Función: Ajuste de Inventario
-- =====================================================
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_warehouse_id uuid,
  p_new_quantity numeric,
  p_reason text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_current_stock numeric;
  v_difference numeric;
  v_product record;
  v_move_id uuid;
begin
  v_company_id := public.get_active_company_id();
  
  if v_company_id is null then
    return json_build_object('success', false, 'error', 'No hay empresa activa');
  end if;
  
  -- Obtener producto
  select * into v_product
  from public.products
  where id = p_product_id and company_id = v_company_id;
  
  if v_product is null then
    return json_build_object('success', false, 'error', 'Producto no encontrado');
  end if;
  
  -- Stock actual
  select coalesce(sum(quantity), 0) into v_current_stock
  from public.stock_moves
  where product_id = p_product_id
  and warehouse_id = p_warehouse_id;
  
  -- Calcular diferencia
  v_difference := p_new_quantity - v_current_stock;
  
  if v_difference = 0 then
    return json_build_object('success', true, 'message', 'No hay diferencia en el stock');
  end if;
  
  -- Crear movimiento de ajuste
  insert into public.stock_moves (
    company_id, product_id, warehouse_id, move_type, 
    quantity, unit_cost, reference, notes, move_date, created_by
  )
  values (
    v_company_id, p_product_id, p_warehouse_id, 'adjustment',
    v_difference, v_product.current_cost, 'AJUSTE', p_reason, current_date, auth.uid()
  )
  returning id into v_move_id;
  
  return json_build_object(
    'success', true,
    'move_id', v_move_id,
    'difference', v_difference,
    'message', case 
      when v_difference > 0 then 'Ajuste positivo: +' || v_difference
      else 'Ajuste negativo: ' || v_difference
    end
  );
end;
$$;

-- =====================================================
-- 9. Índices para performance
-- =====================================================
create index if not exists idx_products_company on public.products(company_id);
create index if not exists idx_products_code on public.products(code);
create index if not exists idx_products_tracked on public.products(is_tracked) where is_tracked = true;

create index if not exists idx_warehouses_company on public.warehouses(company_id);

create index if not exists idx_stock_moves_company on public.stock_moves(company_id);
create index if not exists idx_stock_moves_product on public.stock_moves(product_id);
create index if not exists idx_stock_moves_warehouse on public.stock_moves(warehouse_id);
create index if not exists idx_stock_moves_date on public.stock_moves(move_date);
create index if not exists idx_stock_moves_type on public.stock_moves(move_type);
