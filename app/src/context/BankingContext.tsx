import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from './CompanyContext';
import type {
    BankAccount,
    CreateBankAccountData,
    BankTransaction,
    CreateBankTransactionData,
    BankReconciliation,
    ReconcileData
} from '../types/banking';

interface BankingContextType {
    bankAccounts: BankAccount[];
    bankTransactions: BankTransaction[];
    bankReconciliations: BankReconciliation[];
    loading: boolean;

    // Bank Accounts
    refreshBankAccounts: () => Promise<void>;
    createBankAccount: (data: CreateBankAccountData) => Promise<{ success: boolean; error?: string; id?: string }>;
    updateBankAccount: (id: string, data: Partial<CreateBankAccountData>) => Promise<{ success: boolean; error?: string }>;
    deleteBankAccount: (id: string) => Promise<{ success: boolean; error?: string }>;

    // Bank Transactions
    refreshBankTransactions: () => Promise<void>;
    registerTransaction: (data: CreateBankTransactionData) => Promise<{ success: boolean; error?: string }>;

    // Reconciliations
    refreshReconciliations: () => Promise<void>;
    reconcileBank: (data: ReconcileData) => Promise<{ success: boolean; error?: string }>;
}

const BankingContext = createContext<BankingContextType | undefined>(undefined);

export function BankingProvider({ children }: { children: React.ReactNode }) {
    const { activeCompany } = useCompany();
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
    const [bankReconciliations, setBankReconciliations] = useState<BankReconciliation[]>([]);
    const [loading, setLoading] = useState(false);

    // ==================== BANK ACCOUNTS ====================
    const refreshBankAccounts = useCallback(async () => {
        if (!activeCompany) {
            setBankAccounts([]);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bank_accounts')
                .select('*')
                .order('code');
            if (!error) setBankAccounts((data || []) as BankAccount[]);
        } finally {
            setLoading(false);
        }
    }, [activeCompany]);

    const createBankAccount = async (data: CreateBankAccountData) => {
        if (!activeCompany) return { success: false, error: 'No hay empresa activa' };
        try {
            const { data: result, error } = await supabase
                .from('bank_accounts')
                .insert({
                    company_id: activeCompany.id,
                    ...data,
                    current_balance: data.initial_balance || 0
                })
                .select('id')
                .single();
            if (error) return { success: false, error: error.message };
            await refreshBankAccounts();
            return { success: true, id: result.id };
        } catch {
            return { success: false, error: 'Error al crear cuenta bancaria' };
        }
    };

    const updateBankAccount = async (id: string, data: Partial<CreateBankAccountData>) => {
        try {
            const { error } = await supabase
                .from('bank_accounts')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshBankAccounts();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al actualizar' };
        }
    };

    const deleteBankAccount = async (id: string) => {
        try {
            const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshBankAccounts();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al eliminar' };
        }
    };

    // ==================== BANK TRANSACTIONS ====================
    const refreshBankTransactions = useCallback(async () => {
        if (!activeCompany) {
            setBankTransactions([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('bank_transactions')
                .select(`
                    *,
                    bank_account:bank_accounts!bank_account_id(code, bank_name),
                    destination_account:bank_accounts!destination_account_id(code, bank_name)
                `)
                .order('transaction_date', { ascending: false })
                .limit(100);
            if (!error) setBankTransactions((data || []) as BankTransaction[]);
        } catch { }
    }, [activeCompany]);

    const registerTransaction = async (data: CreateBankTransactionData) => {
        try {
            const { data: result, error } = await supabase.rpc('register_bank_transaction', {
                p_bank_account_id: data.bank_account_id,
                p_transaction_type: data.transaction_type,
                p_amount: data.amount,
                p_transaction_date: data.transaction_date,
                p_description: data.description,
                p_reference: data.reference || null,
                p_destination_account_id: data.destination_account_id || null,
                p_counterpart_account_id: data.counterpart_account_id || null
            });
            if (error) return { success: false, error: error.message };
            if (result?.success) {
                await refreshBankTransactions();
                await refreshBankAccounts();
                return { success: true };
            }
            return { success: false, error: result?.error || 'Error desconocido' };
        } catch {
            return { success: false, error: 'Error al registrar transacción' };
        }
    };

    // ==================== RECONCILIATIONS ====================
    const refreshReconciliations = useCallback(async () => {
        if (!activeCompany) {
            setBankReconciliations([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('bank_reconciliations')
                .select(`
                    *,
                    bank_account:bank_accounts(code, bank_name)
                `)
                .order('reconciliation_date', { ascending: false })
                .limit(50);
            if (!error) setBankReconciliations((data || []) as BankReconciliation[]);
        } catch { }
    }, [activeCompany]);

    const reconcileBank = async (data: ReconcileData) => {
        try {
            const { data: result, error } = await supabase.rpc('reconcile_bank', {
                p_bank_account_id: data.bank_account_id,
                p_reconciliation_date: data.reconciliation_date,
                p_start_date: data.start_date,
                p_end_date: data.end_date,
                p_balance_per_bank: data.balance_per_bank,
                p_transaction_ids: data.transaction_ids,
                p_notes: data.notes || null
            });
            if (error) return { success: false, error: error.message };
            if (result?.success) {
                await refreshReconciliations();
                await refreshBankTransactions();
                return { success: true };
            }
            return { success: false, error: result?.error || 'Error desconocido' };
        } catch {
            return { success: false, error: 'Error al conciliar' };
        }
    };

    const value: BankingContextType = {
        bankAccounts,
        bankTransactions,
        bankReconciliations,
        loading,
        refreshBankAccounts,
        createBankAccount,
        updateBankAccount,
        deleteBankAccount,
        refreshBankTransactions,
        registerTransaction,
        refreshReconciliations,
        reconcileBank
    };

    return (
        <BankingContext.Provider value={value}>
            {children}
        </BankingContext.Provider>
    );
}

export function useBanking() {
    const context = useContext(BankingContext);
    if (context === undefined) {
        throw new Error('useBanking must be used within a BankingProvider');
    }
    return context;
}
