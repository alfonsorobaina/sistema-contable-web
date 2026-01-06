// Tipos para el módulo de Bancos

export interface BankAccount {
    id: string;
    company_id: string;
    code: string;
    bank_name: string;
    account_number: string;
    account_type: 'checking' | 'savings' | 'credit';
    currency: string;
    chart_account_id: string | null;
    initial_balance: number;
    current_balance: number;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateBankAccountData {
    code: string;
    bank_name: string;
    account_number: string;
    account_type?: 'checking' | 'savings' | 'credit';
    currency?: string;
    chart_account_id?: string;
    initial_balance?: number;
    notes?: string;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer';
export type TransactionStatus = 'pending' | 'reconciled';

export interface BankTransaction {
    id: string;
    company_id: string;
    bank_account_id: string;
    transaction_type: TransactionType;
    amount: number;
    transaction_date: string;
    reference: string | null;
    description: string;
    destination_account_id: string | null;
    status: TransactionStatus;
    reconciliation_id: string | null;
    journal_entry_id: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    // Relaciones
    bank_account?: BankAccount;
    destination_account?: BankAccount;
}

export interface CreateBankTransactionData {
    bank_account_id: string;
    transaction_type: TransactionType;
    amount: number;
    transaction_date: string;
    description: string;
    reference?: string;
    destination_account_id?: string;
    counterpart_account_id?: string;
}

export interface BankReconciliation {
    id: string;
    company_id: string;
    bank_account_id: string;
    reconciliation_date: string;
    start_date: string;
    end_date: string;
    balance_per_books: number;
    balance_per_bank: number;
    difference: number;
    notes: string | null;
    adjustments: any;
    status: 'in_progress' | 'completed';
    reconciled_by: string;
    created_at: string;
    completed_at: string | null;
    // Relaciones
    bank_account?: BankAccount;
}

export interface ReconcileData {
    bank_account_id: string;
    reconciliation_date: string;
    start_date: string;
    end_date: string;
    balance_per_bank: number;
    transaction_ids: string[];
    notes?: string;
}

// Constantes
export const ACCOUNT_TYPES = [
    { value: 'checking', label: 'Cuenta Corriente' },
    { value: 'savings', label: 'Cuenta de Ahorros' },
    { value: 'credit', label: 'Tarjeta de Crédito' }
] as const;

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, { label: string; color: string; icon: string }> = {
    deposit: { label: 'Depósito', color: 'bg-emerald-100 text-emerald-700', icon: '↓' },
    withdrawal: { label: 'Retiro', color: 'bg-red-100 text-red-600', icon: '↑' },
    transfer: { label: 'Transferencia', color: 'bg-blue-100 text-blue-700', icon: '↔' }
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
    reconciled: { label: 'Conciliado', color: 'bg-emerald-100 text-emerald-700' }
};

export const CURRENCIES = [
    { value: 'USD', label: 'USD - Dólar' },
    { value: 'VES', label: 'VES - Bolívar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'MXN', label: 'MXN - Peso Mexicano' },
    { value: 'COP', label: 'COP - Peso Colombiano' }
] as const;
