import { useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import { X, Mail, UserPlus, Loader2, Check, AlertCircle } from 'lucide-react';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Role = 'admin' | 'accountant' | 'member' | 'viewer';

const ROLES: { value: Role; label: string; description: string }[] = [
    { value: 'admin', label: 'Administrador', description: 'Acceso total a la empresa' },
    { value: 'accountant', label: 'Contador', description: 'Gestión contable completa' },
    { value: 'member', label: 'Miembro', description: 'Acceso general limitado' },
    { value: 'viewer', label: 'Visualizador', description: 'Solo lectura' },
];

export default function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
    const { inviteMember } = useCompany();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>('member');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        const result = await inviteMember(email, role);

        if (result.success) {
            setSuccess(result.message || 'Miembro invitado correctamente');
            setEmail('');
            setRole('member');
            setTimeout(() => {
                onClose();
                setSuccess(null);
            }, 2000);
        } else {
            setError(result.error || 'Error al invitar miembro');
        }

        setLoading(false);
    };

    const handleClose = () => {
        setEmail('');
        setRole('member');
        setError(null);
        setSuccess(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                            <UserPlus size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Invitar Miembro</h2>
                            <p className="text-xs text-gray-500">Añade un nuevo miembro al equipo</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Alertas */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm">
                            <Check size={16} />
                            {success}
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Email del usuario
                        </label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                required
                                placeholder="usuario@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all"
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500">
                            Si el usuario ya está registrado, se añadirá directamente. Si no, recibirá acceso al registrarse.
                        </p>
                    </div>

                    {/* Rol */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rol en la empresa
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map((roleOption) => (
                                <button
                                    key={roleOption.value}
                                    type="button"
                                    onClick={() => setRole(roleOption.value)}
                                    className={`
                                        p-3 rounded-xl border text-left transition-all
                                        ${role === roleOption.value
                                            ? 'border-teal-400 bg-teal-50 ring-2 ring-teal-400/20'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <p className={`text-sm font-medium ${role === roleOption.value ? 'text-teal-700' : 'text-gray-700'}`}>
                                        {roleOption.label}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {roleOption.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Invitando...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    Invitar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
