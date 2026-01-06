import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from './CompanyContext';
import type {
    Customer,
    CreateCustomerData,
    TaxProfile,
    CreateTaxProfileData,
    Invoice,
    CreateInvoiceData,
    InvoiceLine,
    CreateInvoiceLineData,
    CreditNote
} from '../types/invoicing';

interface InvoicingContextType {
    customers: Customer[];
    taxProfiles: TaxProfile[];
    invoices: Invoice[];
    loading: boolean;
    loadingInvoices: boolean;

    // Customers
    refreshCustomers: () => Promise<void>;
    createCustomer: (data: CreateCustomerData) => Promise<{ success: boolean; error?: string; id?: string }>;
    updateCustomer: (id: string, data: Partial<CreateCustomerData>) => Promise<{ success: boolean; error?: string }>;
    deleteCustomer: (id: string) => Promise<{ success: boolean; error?: string }>;

    // Tax Profiles
    refreshTaxProfiles: () => Promise<void>;
    createTaxProfile: (data: CreateTaxProfileData) => Promise<{ success: boolean; error?: string }>;
    updateTaxProfile: (id: string, data: Partial<CreateTaxProfileData>) => Promise<{ success: boolean; error?: string }>;
    createDefaultTaxProfiles: () => Promise<{ success: boolean; error?: string }>;

    // Invoices
    refreshInvoices: () => Promise<void>;
    getInvoice: (id: string) => Promise<Invoice | null>;
    createInvoice: (data: CreateInvoiceData) => Promise<{ success: boolean; error?: string; id?: string }>;
    updateInvoice: (id: string, data: Partial<CreateInvoiceData>) => Promise<{ success: boolean; error?: string }>;
    deleteInvoice: (id: string) => Promise<{ success: boolean; error?: string }>;

    // Invoice Lines
    addInvoiceLine: (data: CreateInvoiceLineData) => Promise<{ success: boolean; error?: string }>;
    updateInvoiceLine: (id: string, data: Partial<CreateInvoiceLineData>) => Promise<{ success: boolean; error?: string }>;
    deleteInvoiceLine: (id: string) => Promise<{ success: boolean; error?: string }>;

    // Fiscal Actions
    issueInvoice: (invoiceId: string) => Promise<{ success: boolean; error?: string; invoice_number?: string }>;
    createCreditNote: (invoiceId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

const InvoicingContext = createContext<InvoicingContextType | undefined>(undefined);

export function InvoicingProvider({ children }: { children: React.ReactNode }) {
    const { activeCompany } = useCompany();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [taxProfiles, setTaxProfiles] = useState<TaxProfile[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    // ==================== CUSTOMERS ====================
    const refreshCustomers = useCallback(async () => {
        if (!activeCompany) {
            setCustomers([]);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('name');
            if (!error) setCustomers((data || []) as Customer[]);
        } finally {
            setLoading(false);
        }
    }, [activeCompany]);

    const createCustomer = async (data: CreateCustomerData) => {
        if (!activeCompany) return { success: false, error: 'No hay empresa activa' };
        try {
            const { data: result, error } = await supabase
                .from('customers')
                .insert({ company_id: activeCompany.id, ...data })
                .select('id')
                .single();
            if (error) return { success: false, error: error.message };
            await refreshCustomers();
            return { success: true, id: result.id };
        } catch {
            return { success: false, error: 'Error al crear cliente' };
        }
    };

    const updateCustomer = async (id: string, data: Partial<CreateCustomerData>) => {
        try {
            const { error } = await supabase
                .from('customers')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshCustomers();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al actualizar cliente' };
        }
    };

    const deleteCustomer = async (id: string) => {
        try {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshCustomers();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al eliminar cliente' };
        }
    };

    // ==================== TAX PROFILES ====================
    const refreshTaxProfiles = useCallback(async () => {
        if (!activeCompany) {
            setTaxProfiles([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('tax_profiles')
                .select('*')
                .order('rate', { ascending: false });
            if (!error) setTaxProfiles((data || []) as TaxProfile[]);
        } catch { }
    }, [activeCompany]);

    const createTaxProfile = async (data: CreateTaxProfileData) => {
        if (!activeCompany) return { success: false, error: 'No hay empresa activa' };
        try {
            const { error } = await supabase
                .from('tax_profiles')
                .insert({ company_id: activeCompany.id, ...data });
            if (error) return { success: false, error: error.message };
            await refreshTaxProfiles();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al crear perfil' };
        }
    };

    const updateTaxProfile = async (id: string, data: Partial<CreateTaxProfileData>) => {
        try {
            const { error } = await supabase.from('tax_profiles').update(data).eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshTaxProfiles();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al actualizar perfil' };
        }
    };

    const createDefaultTaxProfiles = async () => {
        try {
            const { data, error } = await supabase.rpc('create_default_tax_profiles');
            if (error) return { success: false, error: error.message };
            if (data?.success) {
                await refreshTaxProfiles();
                return { success: true };
            }
            return { success: false, error: data?.error || 'Error desconocido' };
        } catch {
            return { success: false, error: 'Error al crear perfiles' };
        }
    };

    // ==================== INVOICES ====================
    const refreshInvoices = useCallback(async () => {
        if (!activeCompany) {
            setInvoices([]);
            return;
        }
        setLoadingInvoices(true);
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    customer:customers(id, rif, name)
                `)
                .order('created_at', { ascending: false });
            if (!error) setInvoices((data || []) as Invoice[]);
        } finally {
            setLoadingInvoices(false);
        }
    }, [activeCompany]);

    const getInvoice = async (id: string): Promise<Invoice | null> => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    customer:customers(*),
                    lines:invoice_lines(
                        *,
                        tax_profile:tax_profiles(id, name, rate)
                    )
                `)
                .eq('id', id)
                .single();
            if (error) return null;
            return data as Invoice;
        } catch {
            return null;
        }
    };

    const createInvoice = async (data: CreateInvoiceData) => {
        if (!activeCompany) return { success: false, error: 'No hay empresa activa' };
        try {
            const { data: result, error } = await supabase
                .from('invoices')
                .insert({
                    company_id: activeCompany.id,
                    created_by: (await supabase.auth.getUser()).data.user?.id,
                    ...data
                })
                .select('id')
                .single();
            if (error) return { success: false, error: error.message };
            await refreshInvoices();
            return { success: true, id: result.id };
        } catch {
            return { success: false, error: 'Error al crear factura' };
        }
    };

    const updateInvoice = async (id: string, data: Partial<CreateInvoiceData>) => {
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshInvoices();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al actualizar factura' };
        }
    };

    const deleteInvoice = async (id: string) => {
        try {
            const { error } = await supabase.from('invoices').delete().eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshInvoices();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al eliminar factura' };
        }
    };

    // ==================== INVOICE LINES ====================
    const addInvoiceLine = async (data: CreateInvoiceLineData) => {
        try {
            const { error } = await supabase.from('invoice_lines').insert(data);
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch {
            return { success: false, error: 'Error al agregar línea' };
        }
    };

    const updateInvoiceLine = async (id: string, data: Partial<CreateInvoiceLineData>) => {
        try {
            const { error } = await supabase.from('invoice_lines').update(data).eq('id', id);
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch {
            return { success: false, error: 'Error al actualizar línea' };
        }
    };

    const deleteInvoiceLine = async (id: string) => {
        try {
            const { error } = await supabase.from('invoice_lines').delete().eq('id', id);
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch {
            return { success: false, error: 'Error al eliminar línea' };
        }
    };

    // ==================== FISCAL ACTIONS ====================
    const issueInvoice = async (invoiceId: string) => {
        try {
            const { data, error } = await supabase.rpc('issue_invoice', { p_invoice_id: invoiceId });
            if (error) return { success: false, error: error.message };
            if (data?.success) {
                await refreshInvoices();
                return { success: true, invoice_number: data.invoice_number };
            }
            return { success: false, error: data?.error || 'Error desconocido' };
        } catch {
            return { success: false, error: 'Error al emitir factura' };
        }
    };

    const createCreditNote = async (invoiceId: string, reason: string) => {
        try {
            const { data, error } = await supabase.rpc('create_credit_note', {
                p_invoice_id: invoiceId,
                p_reason: reason
            });
            if (error) return { success: false, error: error.message };
            if (data?.success) {
                await refreshInvoices();
                return { success: true };
            }
            return { success: false, error: data?.error || 'Error desconocido' };
        } catch {
            return { success: false, error: 'Error al crear nota de crédito' };
        }
    };

    const value: InvoicingContextType = {
        customers,
        taxProfiles,
        invoices,
        loading,
        loadingInvoices,
        refreshCustomers,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        refreshTaxProfiles,
        createTaxProfile,
        updateTaxProfile,
        createDefaultTaxProfiles,
        refreshInvoices,
        getInvoice,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        addInvoiceLine,
        updateInvoiceLine,
        deleteInvoiceLine,
        issueInvoice,
        createCreditNote
    };

    return (
        <InvoicingContext.Provider value={value}>
            {children}
        </InvoicingContext.Provider>
    );
}

export function useInvoicing() {
    const context = useContext(InvoicingContext);
    if (context === undefined) {
        throw new Error('useInvoicing must be used within an InvoicingProvider');
    }
    return context;
}
