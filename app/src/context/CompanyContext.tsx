import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Company, CreateCompanyData, CompanyMember, CompanyInvitation } from '../types/company';

interface CompanyContextType {
    companies: Company[];
    activeCompany: Company | null;
    loading: boolean;
    members: CompanyMember[];
    invitations: CompanyInvitation[];
    loadingMembers: boolean;
    setActiveCompany: (companyId: string) => Promise<boolean>;
    createCompany: (data: CreateCompanyData) => Promise<{ success: boolean; error?: string }>;
    refreshCompanies: () => Promise<void>;
    refreshMembers: () => Promise<void>;
    inviteMember: (email: string, role: string) => Promise<{ success: boolean; error?: string; message?: string }>;
    updateMemberRole: (memberId: string, newRole: string) => Promise<{ success: boolean; error?: string }>;
    removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const { session } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<CompanyMember[]>([]);
    const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Cargar empresas del usuario
    const refreshCompanies = useCallback(async () => {
        if (!session?.user) {
            setCompanies([]);
            setActiveCompanyState(null);
            setLoading(false);
            return;
        }

        try {
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

            const active = companiesList.find(c => c.is_active);
            setActiveCompanyState(active || companiesList[0] || null);
        } catch (err) {
            console.error('Error in refreshCompanies:', err);
        } finally {
            setLoading(false);
        }
    }, [session?.user]);

    // Cargar miembros de la empresa activa
    const refreshMembers = useCallback(async () => {
        if (!activeCompany) {
            setMembers([]);
            setInvitations([]);
            return;
        }

        setLoadingMembers(true);
        try {
            // Cargar miembros
            const { data: membersData, error: membersError } = await supabase.rpc('get_company_members');

            if (membersError) {
                console.error('Error loading members:', membersError);
            } else {
                setMembers((membersData || []) as CompanyMember[]);
            }

            // Cargar invitaciones pendientes
            const { data: invData, error: invError } = await supabase
                .from('my_company_invitations')
                .select('*');

            if (invError) {
                console.error('Error loading invitations:', invError);
            } else {
                setInvitations((invData || []) as CompanyInvitation[]);
            }
        } catch (err) {
            console.error('Error in refreshMembers:', err);
        } finally {
            setLoadingMembers(false);
        }
    }, [activeCompany]);

    useEffect(() => {
        refreshCompanies();
    }, [refreshCompanies]);

    useEffect(() => {
        refreshMembers();
    }, [refreshMembers]);

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

    // Invitar miembro
    const inviteMember = async (email: string, role: string): Promise<{ success: boolean; error?: string; message?: string }> => {
        try {
            const { data, error } = await supabase.rpc('invite_member', {
                p_email: email,
                p_role: role
            });

            if (error) {
                console.error('Error inviting member:', error);
                return { success: false, error: error.message };
            }

            if (data?.success) {
                await refreshMembers();
                return { success: true, message: data.message };
            }

            return { success: false, error: data?.error || 'Error desconocido' };
        } catch (err) {
            console.error('Error in inviteMember:', err);
            return { success: false, error: 'Error al invitar miembro' };
        }
    };

    // Actualizar rol de miembro
    const updateMemberRole = async (memberId: string, newRole: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data, error } = await supabase.rpc('update_member_role', {
                p_member_id: memberId,
                p_new_role: newRole
            });

            if (error) {
                console.error('Error updating member role:', error);
                return { success: false, error: error.message };
            }

            if (data?.success) {
                await refreshMembers();
                return { success: true };
            }

            return { success: false, error: data?.error || 'Error desconocido' };
        } catch (err) {
            console.error('Error in updateMemberRole:', err);
            return { success: false, error: 'Error al actualizar rol' };
        }
    };

    // Eliminar miembro
    const removeMember = async (memberId: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data, error } = await supabase.rpc('remove_member', {
                p_member_id: memberId
            });

            if (error) {
                console.error('Error removing member:', error);
                return { success: false, error: error.message };
            }

            if (data?.success) {
                await refreshMembers();
                return { success: true };
            }

            return { success: false, error: data?.error || 'Error desconocido' };
        } catch (err) {
            console.error('Error in removeMember:', err);
            return { success: false, error: 'Error al eliminar miembro' };
        }
    };

    const value: CompanyContextType = {
        companies,
        activeCompany,
        loading,
        members,
        invitations,
        loadingMembers,
        setActiveCompany,
        createCompany,
        refreshCompanies,
        refreshMembers,
        inviteMember,
        updateMemberRole,
        removeMember,
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
