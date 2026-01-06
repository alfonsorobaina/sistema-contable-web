import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from './CompanyContext';
import type {
    Account,
    CreateAccountData,
    JournalEntry,
    CreateJournalEntryData,
    AccountBalance,
    FiscalPeriod
} from '../types/accounting';

interface AccountingContextType {
    accounts: Account[];
    journalEntries: JournalEntry[];
    fiscalPeriods: FiscalPeriod[];
    balances: AccountBalance[];
    loading: boolean;
    loadingEntries: boolean;
    refreshAccounts: () => Promise<void>;
    refreshJournalEntries: () => Promise<void>;
    refreshFiscalPeriods: () => Promise<void>;
    getBalances: (asOfDate?: string) => Promise<void>;
    createAccount: (data: CreateAccountData) => Promise<{ success: boolean; error?: string }>;
    updateAccount: (id: string, data: Partial<CreateAccountData>) => Promise<{ success: boolean; error?: string }>;
    deleteAccount: (id: string) => Promise<{ success: boolean; error?: string }>;
    deleteAllAccounts: () => Promise<{ success: boolean; error?: string }>;
    createJournalEntry: (data: CreateJournalEntryData) => Promise<{ success: boolean; error?: string; entry_id?: string }>;
    importBasicChartOfAccounts: () => Promise<{ success: boolean; error?: string; count?: number }>;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

export function AccountingProvider({ children }: { children: React.ReactNode }) {
    const { activeCompany } = useCompany();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([]);
    const [balances, setBalances] = useState<AccountBalance[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingEntries, setLoadingEntries] = useState(false);

    // Cargar plan de cuentas
    const refreshAccounts = useCallback(async () => {
        if (!activeCompany) {
            setAccounts([]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('chart_of_accounts')
                .select('*')
                .order('code');

            if (error) {
                console.error('Error loading accounts:', error);
            } else {
                setAccounts((data || []) as Account[]);
            }
        } catch (err) {
            console.error('Error in refreshAccounts:', err);
        } finally {
            setLoading(false);
        }
    }, [activeCompany]);

    // Cargar asientos
    const refreshJournalEntries = useCallback(async () => {
        if (!activeCompany) {
            setJournalEntries([]);
            return;
        }

        setLoadingEntries(true);
        try {
            const { data, error } = await supabase
                .from('journal_entries')
                .select(`
                    *,
                    lines:journal_entry_lines(
                        *,
                        account:chart_of_accounts(id, code, name)
                    )
                `)
                .order('entry_date', { ascending: false })
                .order('entry_number', { ascending: false });

            if (error) {
                console.error('Error loading entries:', error);
            } else {
                setJournalEntries((data || []) as JournalEntry[]);
            }
        } catch (err) {
            console.error('Error in refreshJournalEntries:', err);
        } finally {
            setLoadingEntries(false);
        }
    }, [activeCompany]);

    // Cargar períodos fiscales
    const refreshFiscalPeriods = useCallback(async () => {
        if (!activeCompany) {
            setFiscalPeriods([]);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('fiscal_periods')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) {
                console.error('Error loading fiscal periods:', error);
            } else {
                setFiscalPeriods((data || []) as FiscalPeriod[]);
            }
        } catch (err) {
            console.error('Error in refreshFiscalPeriods:', err);
        }
    }, [activeCompany]);

    // Obtener balances
    const getBalances = useCallback(async (asOfDate?: string) => {
        if (!activeCompany) {
            setBalances([]);
            return;
        }

        try {
            const { data, error } = await supabase.rpc('get_account_balances', {
                p_as_of_date: asOfDate || new Date().toISOString().split('T')[0]
            });

            if (error) {
                console.error('Error getting balances:', error);
            } else {
                setBalances((data || []) as AccountBalance[]);
            }
        } catch (err) {
            console.error('Error in getBalances:', err);
        }
    }, [activeCompany]);

    // Crear cuenta
    const createAccount = async (data: CreateAccountData): Promise<{ success: boolean; error?: string }> => {
        if (!activeCompany) {
            return { success: false, error: 'No hay empresa activa' };
        }

        try {
            const { error } = await supabase
                .from('chart_of_accounts')
                .insert({
                    company_id: activeCompany.id,
                    code: data.code,
                    name: data.name,
                    account_type: data.account_type,
                    parent_id: data.parent_id || null,
                    is_parent: data.is_parent || false,
                    description: data.description || null
                });

            if (error) {
                return { success: false, error: error.message };
            }

            await refreshAccounts();
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Error al crear cuenta' };
        }
    };

    // Actualizar cuenta
    const updateAccount = async (id: string, data: Partial<CreateAccountData>): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase
                .from('chart_of_accounts')
                .update(data)
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            await refreshAccounts();
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Error al actualizar cuenta' };
        }
    };

    // Eliminar cuenta
    const deleteAccount = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase
                .from('chart_of_accounts')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            await refreshAccounts();
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Error al eliminar cuenta' };
        }
    };

    // Eliminar TODAS las cuentas de la empresa activa
    const deleteAllAccounts = async (): Promise<{ success: boolean; error?: string }> => {
        if (!activeCompany) {
            return { success: false, error: 'No hay empresa activa' };
        }

        try {
            const { error } = await supabase
                .from('chart_of_accounts')
                .delete()
                .eq('company_id', activeCompany.id);

            if (error) {
                return { success: false, error: error.message };
            }

            await refreshAccounts();
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Error al eliminar cuentas' };
        }
    };

    // Crear asiento contable
    const createJournalEntry = async (data: CreateJournalEntryData): Promise<{ success: boolean; error?: string; entry_id?: string }> => {
        try {
            const { data: result, error } = await supabase.rpc('create_journal_entry', {
                p_entry_date: data.entry_date,
                p_description: data.description,
                p_reference: data.reference || null,
                p_lines: data.lines
            });

            if (error) {
                return { success: false, error: error.message };
            }

            if (result?.success) {
                await refreshJournalEntries();
                return { success: true, entry_id: result.entry_id };
            }

            return { success: false, error: result?.error || 'Error desconocido' };
        } catch (err) {
            return { success: false, error: 'Error al crear asiento' };
        }
    };

    // Importar plan contable básico
    const importBasicChartOfAccounts = async (): Promise<{ success: boolean; error?: string; count?: number }> => {
        try {
            const { data, error } = await supabase.rpc('import_basic_chart_of_accounts');

            if (error) {
                return { success: false, error: error.message };
            }

            if (data?.success) {
                await refreshAccounts();
                return { success: true, count: data.count };
            }

            return { success: false, error: data?.error || 'Error desconocido' };
        } catch (err) {
            return { success: false, error: 'Error al importar plan contable' };
        }
    };

    const value: AccountingContextType = {
        accounts,
        journalEntries,
        fiscalPeriods,
        balances,
        loading,
        loadingEntries,
        refreshAccounts,
        refreshJournalEntries,
        refreshFiscalPeriods,
        getBalances,
        createAccount,
        updateAccount,
        deleteAccount,
        deleteAllAccounts,
        createJournalEntry,
        importBasicChartOfAccounts,
    };

    return (
        <AccountingContext.Provider value={value}>
            {children}
        </AccountingContext.Provider>
    );
}

export function useAccounting() {
    const context = useContext(AccountingContext);
    if (context === undefined) {
        throw new Error('useAccounting must be used within an AccountingProvider');
    }
    return context;
}
