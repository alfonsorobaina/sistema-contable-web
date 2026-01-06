// Tipos para el módulo de Cuentas por Cobrar/Pagar
import type { RifType } from './invoicing';

export interface Supplier {
    id: string;
    company_id: string;
    rif: string;
    rif_type: RifType;
    name: string;
    trade_name: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
    email: string | null;
    bank_name: string | null;
    bank_account: string | null;
    bank_account_type: 'corriente' | 'ahorro' | null;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateSupplierData {
    rif: string;
    rif_type: RifType;
    name: string;
    trade_name?: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    email?: string;
    bank_name?: string;
    bank_account?: string;
    bank_account_type?: 'corriente' | 'ahorro';
    notes?: string;
}

export type BillStatus = 'pending' | 'partial' | 'paid' | 'cancelled';

export interface Bill {
    id: string;
    company_id: string;
    supplier_id: string;
    bill_number: string;
    bill_date: string;
    due_date: string | null;
    status: BillStatus;
    subtotal: number;
    tax_amount: number;
    total: number;
    amount_paid: number;
    balance: number;
    currency: string;
    exchange_rate: number;
    notes: string | null;
    journal_entry_id: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    // Relaciones
    supplier?: Supplier;
    lines?: BillLine[];
}

export interface BillLine {
    id: string;
    bill_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    tax_amount: number;
    line_subtotal: number;
    line_total: number;
    sort_order: number;
    created_at: string;
}

export interface CreateBillData {
    supplier_id: string;
    bill_number: string;
    bill_date: string;
    due_date?: string;
    currency?: string;
    exchange_rate?: number;
    notes?: string;
}

export interface CreateBillLineData {
    bill_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
}

export type PaymentType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'transfer' | 'check' | 'card' | 'mobile';

export interface Payment {
    id: string;
    company_id: string;
    payment_type: PaymentType;
    payment_date: string;
    payment_method: PaymentMethod;
    amount: number;
    currency: string;
    exchange_rate: number;
    reference: string | null;
    bank_reference: string | null;
    description: string | null;
    journal_entry_id: string | null;
    created_by: string;
    created_at: string;
    // Relaciones
    allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
    id: string;
    payment_id: string;
    document_type: 'invoice' | 'bill';
    document_id: string;
    amount_applied: number;
    created_at: string;
}

export interface CreatePaymentData {
    payment_type: PaymentType;
    payment_date: string;
    payment_method: PaymentMethod;
    amount: number;
    reference?: string;
    description?: string;
    allocations: {
        document_type: 'invoice' | 'bill';
        document_id: string;
        amount: number;
    }[];
}

export interface AgingReportRow {
    entity_id: string;
    entity_name: string;
    entity_rif: string;
    current_amount: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    days_over_90: number;
    total_balance: number;
}

// Constantes
export const BILL_STATUS_LABELS: Record<BillStatus, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
    partial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Pagada', color: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Anulada', color: 'bg-red-100 text-red-600' }
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, { label: string; color: string }> = {
    income: { label: 'Cobro', color: 'bg-emerald-100 text-emerald-700' },
    expense: { label: 'Pago', color: 'bg-red-100 text-red-600' }
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    check: 'Cheque',
    card: 'Tarjeta',
    mobile: 'Pago Móvil'
};
