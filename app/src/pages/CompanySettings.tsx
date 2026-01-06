import { useState, useEffect } from 'react';
import { useCompany } from '../context/CompanyContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import InviteMemberModal from '../components/InviteMemberModal';
import {
    Building2,
    Save,
    MapPin,
    Phone,
    Mail,
    DollarSign,
    Users,
    Shield,
    Loader2,
    ArrowLeft,
    Check,
    UserPlus,
    MoreVertical,
    Trash2,
    Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrador', color: 'bg-violet-100 text-violet-700' },
    accountant: { label: 'Contador', color: 'bg-blue-100 text-blue-700' },
    member: { label: 'Miembro', color: 'bg-emerald-100 text-emerald-700' },
    viewer: { label: 'Visualizador', color: 'bg-gray-100 text-gray-600' },
};

export default function CompanySettings() {
    const { user } = useAuth();
    const { activeCompany, refreshCompanies, members, invitations, loadingMembers, updateMemberRole, removeMember, refreshMembers } = useCompany();
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        tax_id: '',
        address: '',
        phone: '',
        email: '',
        currency_symbol: 'Bs.'
    });

    useEffect(() => {
        if (activeCompany) {
            setFormData({
                name: activeCompany.name || '',
                tax_id: activeCompany.tax_id || '',
                address: activeCompany.address || '',
                phone: activeCompany.phone || '',
                email: activeCompany.email || '',
                currency_symbol: activeCompany.currency_symbol || 'Bs.'
            });
        }
    }, [activeCompany]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCompany) return;

        setLoading(true);
        setError(null);
        setSaved(false);

        const { error: updateError } = await supabase
            .from('companies')
            .update({
                name: formData.name,
                tax_id: formData.tax_id,
                address: formData.address || null,
                phone: formData.phone || null,
                email: formData.email || null,
                currency_symbol: formData.currency_symbol,
                updated_at: new Date().toISOString()
            })
            .eq('id', activeCompany.id);

        if (updateError) {
            setError(updateError.message);
        } else {
            setSaved(true);
            await refreshCompanies();
            setTimeout(() => setSaved(false), 3000);
        }
        setLoading(false);
    };

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRoleChange = async (memberId: string, newRole: string) => {
        setActionLoading(memberId);
        await updateMemberRole(memberId, newRole);
        setOpenMenuId(null);
        setActionLoading(null);
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('¿Estás seguro de eliminar este miembro?')) return;
        setActionLoading(memberId);
        await removeMember(memberId);
        setOpenMenuId(null);
        setActionLoading(null);
    };

    const getInitials = (name: string | null, email: string) => {
        if (name) {
            return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        }
        return email[0].toUpperCase();
    };

    if (!activeCompany) {
        return (
            <div className="text-center py-16">
                <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">No hay empresa seleccionada</h2>
                <p className="text-gray-500 mt-2">Crea o selecciona una empresa primero</p>
            </div>
        );
    }

    const isAdmin = activeCompany.role === 'admin';

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft size={16} />
                    Volver al Dashboard
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                        <Building2 size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Configuración de Empresa</h1>
                        <p className="text-gray-500">{activeCompany.name}</p>
                    </div>
                </div>
            </div>

            {/* Alertas */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                    {error}
                </div>
            )}

            {saved && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 flex items-center gap-2">
                    <Check size={18} />
                    Cambios guardados correctamente
                </div>
            )}

            {!isAdmin && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 flex items-center gap-2">
                    <Shield size={18} />
                    Solo los administradores pueden editar la información de la empresa
                </div>
            )}

            {/* Formulario */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Building2 size={18} className="text-gray-400" />
                    <h2 className="font-semibold text-gray-800">Información General</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Nombre de la Empresa
                            </label>
                            <input
                                type="text"
                                required
                                disabled={!isAdmin}
                                value={formData.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* RIF */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                RIF / Identificación Fiscal
                            </label>
                            <input
                                type="text"
                                required
                                disabled={!isAdmin}
                                value={formData.tax_id}
                                onChange={(e) => updateField('tax_id', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Dirección
                        </label>
                        <div className="relative">
                            <MapPin size={18} className="absolute left-4 top-3 text-gray-400" />
                            <textarea
                                disabled={!isAdmin}
                                value={formData.address}
                                onChange={(e) => updateField('address', e.target.value)}
                                rows={2}
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Teléfono */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Teléfono
                            </label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    disabled={!isAdmin}
                                    value={formData.phone}
                                    onChange={(e) => updateField('phone', e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    disabled={!isAdmin}
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Moneda */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Moneda
                            </label>
                            <div className="relative">
                                <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    disabled={!isAdmin}
                                    value={formData.currency_symbol}
                                    onChange={(e) => updateField('currency_symbol', e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all appearance-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                                >
                                    <option value="Bs.">Bs. - Bolívares</option>
                                    <option value="$">$ - Dólares</option>
                                    <option value="€">€ - Euros</option>
                                    <option value="COP">COP - Pesos Colombianos</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="pt-4 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* Sección de Miembros */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users size={18} className="text-gray-400" />
                        <h2 className="font-semibold text-gray-800">Miembros del Equipo</h2>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {members.length}
                        </span>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all"
                        >
                            <UserPlus size={16} />
                            Invitar
                        </button>
                    )}
                </div>

                <div className="divide-y divide-gray-100">
                    {loadingMembers ? (
                        <div className="p-8 text-center">
                            <Loader2 size={24} className="mx-auto text-gray-400 animate-spin" />
                        </div>
                    ) : members.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Users size={40} className="mx-auto mb-3 text-gray-300" />
                            <p>No hay miembros en esta empresa</p>
                        </div>
                    ) : (
                        members.map((member) => (
                            <div key={member.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                                    {getInitials(member.full_name, member.email)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {member.full_name || member.email}
                                        {member.user_id === user?.id && (
                                            <span className="ml-2 text-xs text-gray-400">(Tú)</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                </div>

                                {/* Rol */}
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_LABELS[member.role]?.color || 'bg-gray-100 text-gray-600'}`}>
                                    {ROLE_LABELS[member.role]?.label || member.role}
                                </span>

                                {/* Acciones */}
                                {isAdmin && member.user_id !== user?.id && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                            disabled={actionLoading === member.id}
                                        >
                                            {actionLoading === member.id ? (
                                                <Loader2 size={16} className="animate-spin text-gray-400" />
                                            ) : (
                                                <MoreVertical size={16} className="text-gray-400" />
                                            )}
                                        </button>

                                        {openMenuId === member.id && (
                                            <>
                                                <div className="fixed inset-0" onClick={() => setOpenMenuId(null)} />
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                                                    <p className="px-3 py-1.5 text-xs text-gray-400 uppercase tracking-wider">Cambiar rol</p>
                                                    {Object.entries(ROLE_LABELS).map(([role, { label }]) => (
                                                        <button
                                                            key={role}
                                                            onClick={() => handleRoleChange(member.id, role)}
                                                            disabled={member.role === role}
                                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${member.role === role ? 'text-teal-600 font-medium' : 'text-gray-700'}`}
                                                        >
                                                            {label} {member.role === role && '✓'}
                                                        </button>
                                                    ))}
                                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                                        <button
                                                            onClick={() => handleRemoveMember(member.id)}
                                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} />
                                                            Eliminar miembro
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {/* Invitaciones pendientes */}
                    {invitations.length > 0 && (
                        <>
                            <div className="px-6 py-3 bg-amber-50">
                                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider flex items-center gap-2">
                                    <Clock size={14} />
                                    Invitaciones Pendientes ({invitations.length})
                                </p>
                            </div>
                            {invitations.map((inv) => (
                                <div key={inv.id} className="px-6 py-4 flex items-center gap-4 bg-amber-50/50">
                                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 text-sm font-bold">
                                        {inv.email[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 truncate">{inv.email}</p>
                                        <p className="text-xs text-gray-500">Pendiente de registro</p>
                                    </div>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_LABELS[inv.role]?.color || 'bg-gray-100 text-gray-600'}`}>
                                        {ROLE_LABELS[inv.role]?.label || inv.role}
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Modal de invitación */}
            <InviteMemberModal
                isOpen={showInviteModal}
                onClose={() => {
                    setShowInviteModal(false);
                    refreshMembers();
                }}
            />
        </div>
    );
}
