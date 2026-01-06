// Tipos para el sistema multiempresa YOT

export interface Company {
    id: string;
    name: string;
    tax_id: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    currency_symbol: string;
    created_at: string;
    role: 'admin' | 'accountant' | 'member' | 'viewer';
    is_active: boolean;
}

export interface CreateCompanyData {
    name: string;
    tax_id: string;
    address?: string;
    phone?: string;
    email?: string;
    currency_symbol?: string;
}

export interface CompanyMember {
    id: string;
    user_id: string;
    role: 'admin' | 'accountant' | 'member' | 'viewer';
    created_at: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
}

export interface CompanyInvitation {
    id: string;
    email: string;
    role: 'admin' | 'accountant' | 'member' | 'viewer';
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    created_at: string;
    expires_at: string;
}
