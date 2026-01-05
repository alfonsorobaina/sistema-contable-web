import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Company, CreateCompanyData } from '../types/company';

interface CompanyContextType {
    companies: Company[];
    activeCompany: Company | null;
    loading: boolean;
    setActiveCompany: (companyId: string) => Promise<boolean>;
    createCompany: (data: CreateCompanyData) => Promise<{ success: boolean; error?: string }>;
    refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const { session } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    // Cargar empresas del usuario
    const refreshCompanies = useCallback(async () => {
        if (!session?.user) {
            setCompanies([]);
            setActiveCompanyState(null);
            setLoading(false);
            return;
        }

        try {
            // Usar la vista my_companies que ya filtra por usuario
            const { data, error } = await supabase
                .from('my_companies')
                .select('*')
                .order('name');

            if (error) {
                console.error('Error loading companies:', error);
                setLoading(false);
                return;
            }

            const companiesList = (data || []) as Company[];
            setCompanies(companiesList);

            // Establecer empresa activa
            const active = companiesList.find(c => c.is_active);
            setActiveCompanyState(active || companiesList[0] || null);
        } catch (err) {
            console.error('Error in refreshCompanies:', err);
        } finally {
            setLoading(false);
        }
    }, [session?.user]);

    useEffect(() => {
        refreshCompanies();
    }, [refreshCompanies]);

    // Cambiar empresa activa
    const setActiveCompany = async (companyId: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase.rpc('set_active_company', {
                p_company_id: companyId
            });

            if (error) {
                console.error('Error setting active company:', error);
                return false;
            }

            if (data?.success) {
                await refreshCompanies();
                return true;
            }

            return false;
        } catch (err) {
            console.error('Error in setActiveCompany:', err);
            return false;
        }
    };

    // Crear nueva empresa
    const createCompany = async (companyData: CreateCompanyData): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data, error } = await supabase.rpc('create_company', {
                p_name: companyData.name,
                p_tax_id: companyData.tax_id,
                p_address: companyData.address || null,
                p_phone: companyData.phone || null,
                p_email: companyData.email || null,
                p_currency_symbol: companyData.currency_symbol || 'Bs.'
            });

            if (error) {
                console.error('Error creating company:', error);
                return { success: false, error: error.message };
            }

            if (data?.success) {
                await refreshCompanies();
                return { success: true };
            }

            return { success: false, error: data?.error || 'Error desconocido' };
        } catch (err) {
            console.error('Error in createCompany:', err);
            return { success: false, error: 'Error al crear empresa' };
        }
    };

    const value: CompanyContextType = {
        companies,
        activeCompany,
        loading,
        setActiveCompany,
        createCompany,
        refreshCompanies,
    };

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
}
