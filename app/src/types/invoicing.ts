// Tipos para el módulo de facturación Venezuela (SENIAT)

export type RifType = 'J' | 'V' | 'G' | 'E' | 'P' | 'C';

export interface Customer {
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
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateCustomerData {
    rif: string;
    rif_type: RifType;
    name: string;
    trade_name?: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    email?: string;
    notes?: string;
}

export interface TaxProfile {
    id: string;
    company_id: string;
    name: string;
    rate: number;
    is_default: boolean;
    is_active: boolean;
    sales_account_id: string | null;
    tax_account_id: string | null;
    created_at: string;
}

export interface CreateTaxProfileData {
    name: string;
    rate: number;
    is_default?: boolean;
    sales_account_id?: string;
    tax_account_id?: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';

export interface Invoice {
    id: string;
    company_id: string;
    customer_id: string;
    invoice_number: string | null;
    control_number: string | null;
    invoice_date: string;
    due_date: string | null;
    status: InvoiceStatus;
    subtotal: number;
    tax_amount: number;
    total: number;
    amount_paid: number;  // Monto pagado (para CxC)
    currency: string;
    exchange_rate: number;
    notes: string | null;
    journal_entry_id: string | null;
    created_by: string;
    issued_at: string | null;
    issued_by: string | null;
    created_at: string;
    updated_at: string;
    // Relaciones
    customer?: Customer;
    lines?: InvoiceLine[];
}

export interface InvoiceLine {
    id: string;
    invoice_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_profile_id: string | null;
    tax_rate: number;
    tax_amount: number;
    line_subtotal: number;
    line_total: number;
    sort_order: number;
    created_at: string;
    // Relación
    tax_profile?: TaxProfile;
}

export interface CreateInvoiceData {
    customer_id: string;
    invoice_date: string;
    due_date?: string;
    currency?: string;
    exchange_rate?: number;
    notes?: string;
}

export interface CreateInvoiceLineData {
    invoice_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_profile_id?: string;
    tax_rate?: number;
}

export interface CreditNote {
    id: string;
    company_id: string;
    invoice_id: string;
    note_number: string;
    control_number: string;
    note_date: string;
    reason: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    journal_entry_id: string | null;
    created_by: string;
    created_at: string;
}

export interface FiscalSequence {
    id: string;
    company_id: string;
    sequence_type: 'invoice' | 'credit_note' | 'debit_note';
    prefix: string;
    current_number: number;
    control_prefix: string;
    control_current: number;
    is_active: boolean;
    created_at: string;
}

// Constantes
export const RIF_TYPES: Record<RifType, string> = {
    J: 'Jurídica',
    V: 'Venezolano',
    G: 'Gobierno',
    E: 'Extranjero',
    P: 'Pasaporte',
    C: 'Comunal'
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-600' },
    issued: { label: 'Emitida', color: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Pagada', color: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Anulada', color: 'bg-red-100 text-red-600' }
};

export const VENEZUELA_STATES = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas',
    'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital',
    'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda',
    'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira',
    'Trujillo', 'La Guaira', 'Yaracuy', 'Zulia'
];

// Validador de RIF venezolano
export function validateRIF(rif: string): boolean {
    // Formato: J-12345678-9 o J123456789
    const cleanRif = rif.replace(/[-\s]/g, '').toUpperCase();
    const pattern = /^[JVGEPC]\d{9}$/;
    return pattern.test(cleanRif);
}

export function formatRIF(rif: string): string {
    const clean = rif.replace(/[-\s]/g, '').toUpperCase();
    if (clean.length !== 10) return rif;
    return `${clean[0]}-${clean.slice(1, 9)}-${clean[9]}`;
}
