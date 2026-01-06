export interface Employee {
    id: string;
    company_id: string;
    first_name: string;
    last_name: string;
    document_id: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    hire_date: string;
    position: string | null;
    department: string | null;
    base_salary: number;
    risk_level: 'minimum' | 'medium' | 'maximum';
    payment_method: 'transfer' | 'cash' | 'check';
    bank_account_info: {
        bank_name: string;
        account_number: string;
        account_type?: string;
    } | null;
    is_active: boolean;
    status: 'active' | 'vacation' | 'suspended' | 'terminated';
    created_at: string;
    updated_at: string;
}

export interface CreateEmployeeData {
    first_name: string;
    last_name: string;
    document_id: string;
    email?: string;
    phone?: string;
    address?: string;
    hire_date: string;
    position?: string;
    department?: string;
    base_salary: number;
    risk_level: 'minimum' | 'medium' | 'maximum';
    payment_method: 'transfer' | 'cash' | 'check';
    bank_account_info?: {
        bank_name: string;
        account_number: string;
        account_type?: string;
    };
    status?: 'active' | 'vacation' | 'suspended' | 'terminated';
}

export interface PayrollConcept {
    id: string;
    company_id: string;
    code: string;
    name: string;
    concept_type: 'earning' | 'deduction' | 'company_contribution';
    is_fixed_amount: boolean;
    amount: number;
    system_code: string | null;
    chart_account_id: string | null;
    is_active: boolean;
}

export interface PayrollRun {
    id: string;
    company_id: string;
    period_start: string;
    period_end: string;
    payment_date: string | null;
    name: string;
    total_earnings: number;
    total_deductions: number;
    total_company_contributions: number;
    net_total: number;
    status: 'draft' | 'approved' | 'paid' | 'void';
    journal_entry_id: string | null;
    exchange_rate: number;
    created_at: string;
}

export interface PayrollLine {
    id: string;
    payroll_run_id: string;
    employee_id: string;
    concept_id: string;
    amount: number;
    concept_name: string;
    concept_type: 'earning' | 'deduction' | 'company_contribution';
    employee?: Employee; // Joined
}

export const RISK_LEVELS = [
    { value: 'minimum', label: 'Mínimo (9%)' },
    { value: 'medium', label: 'Medio (10%)' },
    { value: 'maximum', label: 'Máximo (11%)' }
] as const;

export const CONCEPT_TYPES = [
    { value: 'earning', label: 'Asignación' },
    { value: 'deduction', label: 'Deducción' },
    { value: 'company_contribution', label: 'Aporte Patronal' }
] as const;
