// Tipos para el módulo de contabilidad YOT

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
    id: string;
    company_id: string;
    parent_id: string | null;
    code: string;
    name: string;
    account_type: AccountType;
    is_parent: boolean;
    is_active: boolean;
    description: string | null;
    created_at: string;
}

export interface CreateAccountData {
    code: string;
    name: string;
    account_type: AccountType;
    parent_id?: string;
    is_parent?: boolean;
    description?: string;
}

export interface JournalEntry {
    id: string;
    company_id: string;
    fiscal_period_id: string | null;
    entry_number: number;
    entry_date: string;
    description: string;
    reference: string | null;
    status: 'draft' | 'posted' | 'cancelled';
    created_by: string;
    created_at: string;
    posted_at: string | null;
    lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
    id: string;
    journal_entry_id: string;
    account_id: string;
    description: string | null;
    debit: number;
    credit: number;
    account?: Account;
}

export interface CreateJournalEntryData {
    entry_date: string;
    description: string;
    reference?: string;
    lines: {
        account_id: string;
        description?: string;
        debit: number;
        credit: number;
    }[];
}

export interface FiscalPeriod {
    id: string;
    company_id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    created_at: string;
}

export interface AccountBalance {
    account_id: string;
    account_code: string;
    account_name: string;
    account_type: AccountType;
    total_debit: number;
    total_credit: number;
    balance: number;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, { label: string; color: string }> = {
    asset: { label: 'Activo', color: 'bg-blue-100 text-blue-700' },
    liability: { label: 'Pasivo', color: 'bg-red-100 text-red-700' },
    equity: { label: 'Patrimonio', color: 'bg-purple-100 text-purple-700' },
    income: { label: 'Ingreso', color: 'bg-emerald-100 text-emerald-700' },
    expense: { label: 'Gasto', color: 'bg-amber-100 text-amber-700' },
};
