import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from './CompanyContext';
import type { Employee, CreateEmployeeData, PayrollConcept, PayrollRun, PayrollLine } from '../types/payroll';

interface PayrollContextType {
    employees: Employee[];
    concepts: PayrollConcept[];
    payrollRuns: PayrollRun[];
    loading: boolean;
    refreshEmployees: () => Promise<void>;
    refreshConcepts: () => Promise<void>;
    refreshPayrollRuns: () => Promise<void>;
    createEmployee: (data: CreateEmployeeData) => Promise<{ success: boolean; error?: string }>;
    updateEmployee: (id: string, data: Partial<CreateEmployeeData>) => Promise<{ success: boolean; error?: string }>;
    createConcept: (data: Partial<PayrollConcept>) => Promise<{ success: boolean; error?: string }>;
    updateConcept: (id: string, data: Partial<PayrollConcept>) => Promise<{ success: boolean; error?: string }>;
    runPayroll: (startDate: string, endDate: string, name?: string) => Promise<{ success: boolean; error?: string }>;
    getPayrollLines: (runId: string) => Promise<PayrollLine[]>;
    approvePayroll: (runId: string) => Promise<{ success: boolean; error?: string }>;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

export function PayrollProvider({ children }: { children: React.ReactNode }) {
    const { activeCompany } = useCompany();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [concepts, setConcepts] = useState<PayrollConcept[]>([]);
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshEmployees = useCallback(async () => {
        if (!activeCompany) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('company_id', activeCompany.id)
                .order('last_name');
            if (!error) setEmployees(data as Employee[]);
        } finally {
            setLoading(false);
        }
    }, [activeCompany]);

    const refreshConcepts = useCallback(async () => {
        if (!activeCompany) return;
        setLoading(true);
        try {
            // Primero aseguramos que existan los conceptos base
            await supabase.rpc('initialize_venezuela_payroll_concepts', { p_company_id: activeCompany.id });

            const { data, error } = await supabase
                .from('payroll_concepts')
                .select('*')
                .eq('company_id', activeCompany.id)
                .order('code');
            if (!error) setConcepts(data as PayrollConcept[]);
        } finally {
            setLoading(false);
        }
    }, [activeCompany]);

    const refreshPayrollRuns = useCallback(async () => {
        if (!activeCompany) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('payroll_runs')
                .select('*')
                .eq('company_id', activeCompany.id)
                .order('period_start', { ascending: false });
            if (!error) setPayrollRuns(data as PayrollRun[]);
        } finally {
            setLoading(false);
        }
    }, [activeCompany]);

    const createEmployee = async (data: CreateEmployeeData) => {
        if (!activeCompany) return { success: false, error: 'No company' };
        const { error } = await supabase.from('employees').insert({ ...data, company_id: activeCompany.id });
        if (error) return { success: false, error: error.message };
        await refreshEmployees();
        return { success: true };
    };

    const updateEmployee = async (id: string, data: Partial<CreateEmployeeData>) => {
        const { error } = await supabase.from('employees').update(data).eq('id', id);
        if (error) return { success: false, error: error.message };
        await refreshEmployees();
        return { success: true };
    };

    const createConcept = async (data: Partial<PayrollConcept>) => {
        if (!activeCompany) return { success: false, error: 'No company' };
        const { error } = await supabase.from('payroll_concepts').insert({ ...data, company_id: activeCompany.id });
        if (error) return { success: false, error: error.message };
        await refreshConcepts();
        return { success: true };
    };

    const updateConcept = async (id: string, data: Partial<PayrollConcept>) => {
        if (id === 'init') {
            // Special case for manual initialization
            await refreshConcepts();
            return { success: true };
        }
        const { error } = await supabase.from('payroll_concepts').update(data).eq('id', id);
        if (error) return { success: false, error: error.message };
        await refreshConcepts();
        return { success: true };
    };

    const runPayroll = async (startDate: string, endDate: string, name?: string) => {
        try {
            const { data, error } = await supabase.rpc('run_payroll', {
                p_start_date: startDate,
                p_end_date: endDate,
                p_name: name
            });
            if (error) return { success: false, error: error.message };
            if (data?.success) {
                await refreshPayrollRuns();
                return { success: true };
            }
            return { success: false, error: data?.error || 'Error desconocido' };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const getPayrollLines = async (runId: string) => {
        const { data } = await supabase
            .from('payroll_lines')
            .select(`
                *,
                employee:employees(first_name, last_name, document_id)
            `)
            .eq('payroll_run_id', runId);
        return (data || []) as PayrollLine[];
    };

    const approvePayroll = async (runId: string) => {
        // Por ahora solo cambiamos status, falta integración contable completa (post_payroll_accounting)
        const { error } = await supabase
            .from('payroll_runs')
            .update({ status: 'approved' })
            .eq('id', runId);
        if (error) return { success: false, error: error.message };
        await refreshPayrollRuns();
        return { success: true };
    };

    return (
        <PayrollContext.Provider value={{
            employees,
            concepts,
            payrollRuns,
            loading,
            refreshEmployees,
            refreshConcepts,
            refreshPayrollRuns,
            createEmployee,
            updateEmployee,
            createConcept,
            updateConcept,
            runPayroll,
            getPayrollLines,
            approvePayroll
        }}>
            {children}
        </PayrollContext.Provider>
    );
}

export function usePayroll() {
    const context = useContext(PayrollContext);
    if (!context) throw new Error('usePayroll must be used within PayrollProvider');
    return context;
}
