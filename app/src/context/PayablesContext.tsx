import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from './CompanyContext';
import type {
    Supplier,
    CreateSupplierData,
    Bill,
    CreateBillData,
    CreateBillLineData,
    Payment,
    CreatePaymentData,
    AgingReportRow
} from '../types/payables';
import type { Invoice } from '../types/invoicing';

interface PayablesContextType {
    suppliers: Supplier[];
    bills: Bill[];
    payments: Payment[];
    receivables: Invoice[];
    loading: boolean;
    loadingBills: boolean;

    // Suppliers
    refreshSuppliers: () => Promise<void>;
    createSupplier: (data: CreateSupplierData) => Promise<{ success: boolean; error?: string; id?: string }>;
    updateSupplier: (id: string, data: Partial<CreateSupplierData>) => Promise<{ success: boolean; error?: string }>;
    deleteSupplier: (id: string) => Promise<{ success: boolean; error?: string }>;

    // Bills
    refreshBills: () => Promise<void>;
    getBill: (id: string) => Promise<Bill | null>;
    createBill: (data: CreateBillData) => Promise<{ success: boolean; error?: string; id?: string }>;
    updateBill: (id: string, data: Partial<CreateBillData>) => Promise<{ success: boolean; error?: string }>;
    deleteBill: (id: string) => Promise<{ success: boolean; error?: string }>;
    addBillLine: (data: CreateBillLineData) => Promise<{ success: boolean; error?: string }>;

    // Receivables (facturas pendientes)
    refreshReceivables: () => Promise<void>;

    // Payments
    refreshPayments: () => Promise<void>;
    registerPayment: (data: CreatePaymentData) => Promise<{ success: boolean; error?: string }>;

    // Reports
    getAgingReport: (type: 'receivable' | 'payable') => Promise<AgingReportRow[]>;
}

const PayablesContext = createContext<PayablesContextType | undefined>(undefined);

export function PayablesProvider({ children }: { children: React.ReactNode }) {
    const { activeCompany } = useCompany();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [receivables, setReceivables] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingBills, setLoadingBills] = useState(false);

    // ==================== SUPPLIERS ====================
    const refreshSuppliers = useCallback(async () => {
        if (!activeCompany) {
            setSuppliers([]);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .order('name');
            if (!error) setSuppliers((data || []) as Supplier[]);
        } finally {
            setLoading(false);
        }
    }, [activeCompany]);

    const createSupplier = async (data: CreateSupplierData) => {
        if (!activeCompany) return { success: false, error: 'No hay empresa activa' };
        try {
            const { data: result, error } = await supabase
                .from('suppliers')
                .insert({ company_id: activeCompany.id, ...data })
                .select('id')
                .single();
            if (error) return { success: false, error: error.message };
            await refreshSuppliers();
            return { success: true, id: result.id };
        } catch {
            return { success: false, error: 'Error al crear proveedor' };
        }
    };

    const updateSupplier = async (id: string, data: Partial<CreateSupplierData>) => {
        try {
            const { error } = await supabase
                .from('suppliers')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshSuppliers();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al actualizar proveedor' };
        }
    };

    const deleteSupplier = async (id: string) => {
        try {
            const { error } = await supabase.from('suppliers').delete().eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshSuppliers();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al eliminar proveedor' };
        }
    };

    // ==================== BILLS ====================
    const refreshBills = useCallback(async () => {
        if (!activeCompany) {
            setBills([]);
            return;
        }
        setLoadingBills(true);
        try {
            const { data, error } = await supabase
                .from('bills')
                .select(`
                    *,
                    supplier:suppliers(id, rif, name)
                `)
                .order('created_at', { ascending: false });
            if (!error) setBills((data || []) as Bill[]);
        } finally {
            setLoadingBills(false);
        }
    }, [activeCompany]);

    const getBill = async (id: string): Promise<Bill | null> => {
        try {
            const { data, error } = await supabase
                .from('bills')
                .select(`
                    *,
                    supplier:suppliers(*),
                    lines:bill_lines(*)
                `)
                .eq('id', id)
                .single();
            if (error) return null;
            return data as Bill;
        } catch {
            return null;
        }
    };

    const createBill = async (data: CreateBillData) => {
        if (!activeCompany) return { success: false, error: 'No hay empresa activa' };
        try {
            const { data: result, error } = await supabase
                .from('bills')
                .insert({
                    company_id: activeCompany.id,
                    created_by: (await supabase.auth.getUser()).data.user?.id,
                    ...data
                })
                .select('id')
                .single();
            if (error) return { success: false, error: error.message };
            await refreshBills();
            return { success: true, id: result.id };
        } catch {
            return { success: false, error: 'Error al crear factura' };
        }
    };

    const updateBill = async (id: string, data: Partial<CreateBillData>) => {
        try {
            const { error } = await supabase.from('bills').update(data).eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshBills();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al actualizar' };
        }
    };

    const deleteBill = async (id: string) => {
        try {
            const { error } = await supabase.from('bills').delete().eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshBills();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al eliminar' };
        }
    };

    const addBillLine = async (data: CreateBillLineData) => {
        try {
            const { error } = await supabase.from('bill_lines').insert(data);
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch {
            return { success: false, error: 'Error al agregar línea' };
        }
    };

    // ==================== RECEIVABLES ====================
    const refreshReceivables = useCallback(async () => {
        if (!activeCompany) {
            setReceivables([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    customer:customers(id, rif, name)
                `)
                .in('status', ['issued'])
                .order('invoice_date', { ascending: false });
            if (!error) setReceivables((data || []) as Invoice[]);
        } catch { }
    }, [activeCompany]);

    // ==================== PAYMENTS ====================
    const refreshPayments = useCallback(async () => {
        if (!activeCompany) {
            setPayments([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .order('payment_date', { ascending: false });
            if (!error) setPayments((data || []) as Payment[]);
        } catch { }
    }, [activeCompany]);

    const registerPayment = async (data: CreatePaymentData) => {
        try {
            const { data: result, error } = await supabase.rpc('register_payment', {
                p_payment_type: data.payment_type,
                p_payment_date: data.payment_date,
                p_payment_method: data.payment_method,
                p_amount: data.amount,
                p_reference: data.reference || null,
                p_description: data.description || null,
                p_allocations: data.allocations
            });
            if (error) return { success: false, error: error.message };
            if (result?.success) {
                await refreshPayments();
                await refreshReceivables();
                await refreshBills();
                return { success: true };
            }
            return { success: false, error: result?.error || 'Error desconocido' };
        } catch {
            return { success: false, error: 'Error al registrar pago' };
        }
    };

    // ==================== REPORTS ====================
    const getAgingReport = async (type: 'receivable' | 'payable'): Promise<AgingReportRow[]> => {
        try {
            const { data, error } = await supabase.rpc('get_aging_report', {
                p_report_type: type
            });
            if (error) return [];
            return (data || []) as AgingReportRow[];
        } catch {
            return [];
        }
    };

    const value: PayablesContextType = {
        suppliers,
        bills,
        payments,
        receivables,
        loading,
        loadingBills,
        refreshSuppliers,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        refreshBills,
        getBill,
        createBill,
        updateBill,
        deleteBill,
        addBillLine,
        refreshReceivables,
        refreshPayments,
        registerPayment,
        getAgingReport
    };

    return (
        <PayablesContext.Provider value={value}>
            {children}
        </PayablesContext.Provider>
    );
}

export function usePayables() {
    const context = useContext(PayablesContext);
    if (context === undefined) {
        throw new Error('usePayables must be used within a PayablesProvider');
    }
    return context;
}
