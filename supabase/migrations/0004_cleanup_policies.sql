-- =====================================================
-- LIMPIEZA: Eliminar políticas existentes de facturación
-- Ejecutar ANTES de 0004_invoicing_schema.sql
-- =====================================================

-- Eliminar políticas de customers
drop policy if exists "Users can view customers of their active company" on public.customers;
drop policy if exists "Users can insert customers" on public.customers;
drop policy if exists "Users can update customers" on public.customers;

-- Eliminar políticas de tax_profiles
drop policy if exists "Users can view tax profiles of their active company" on public.tax_profiles;
drop policy if exists "Admins can manage tax profiles" on public.tax_profiles;

-- Eliminar políticas de fiscal_sequences
drop policy if exists "Users can view fiscal sequences" on public.fiscal_sequences;
drop policy if exists "Admins can manage fiscal sequences" on public.fiscal_sequences;

-- Eliminar políticas de invoices
drop policy if exists "Users can view invoices of their active company" on public.invoices;
drop policy if exists "Users can insert invoices" on public.invoices;
drop policy if exists "Users can update draft invoices" on public.invoices;

-- Eliminar políticas de invoice_lines
drop policy if exists "Users can view invoice lines" on public.invoice_lines;
drop policy if exists "Users can manage lines of draft invoices" on public.invoice_lines;

-- Eliminar políticas de credit_notes
drop policy if exists "Users can view credit notes" on public.credit_notes;
drop policy if exists "Admins can create credit notes" on public.credit_notes;
