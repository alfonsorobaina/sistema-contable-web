-- =====================================================
-- LIMPIEZA: Eliminar políticas existentes de CxC/CxP
-- Ejecutar ANTES de 0005_accounts_receivable_payable.sql
-- =====================================================

-- Eliminar políticas de suppliers
drop policy if exists "Users can view suppliers of their active company" on public.suppliers;
drop policy if exists "Users can insert suppliers" on public.suppliers;
drop policy if exists "Users can update suppliers" on public.suppliers;

-- Eliminar políticas de bills
drop policy if exists "Users can view bills of their active company" on public.bills;
drop policy if exists "Users can insert bills" on public.bills;
drop policy if exists "Users can update pending bills" on public.bills;

-- Eliminar políticas de bill_lines
drop policy if exists "Users can view bill lines" on public.bill_lines;
drop policy if exists "Users can manage bill lines" on public.bill_lines;

-- Eliminar políticas de payments
drop policy if exists "Users can view payments of their active company" on public.payments;
drop policy if exists "Users can create payments" on public.payments;

-- Eliminar políticas de payment_allocations
drop policy if exists "Users can view payment allocations" on public.payment_allocations;

-- Eliminar triggers existentes
drop trigger if exists on_payment_allocation_invoice on public.payment_allocations;
drop trigger if exists on_payment_allocation_bill on public.payment_allocations;
drop trigger if exists on_bill_line_change on public.bill_lines;
