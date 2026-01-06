import { useState } from 'react';
import { useInvoicing } from '../../context/InvoicingContext';
import type { TaxProfile, CreateTaxProfileData } from '../../types/invoicing';
import {
    Plus,
    Loader2,
    Edit2,
    X,
    Check,
    AlertCircle,
    Percent,
    Download
} from 'lucide-react';

export default function TaxProfiles() {
    const { taxProfiles, loading, createTaxProfile, updateTaxProfile, createDefaultTaxProfiles } = useInvoicing();
    const [showModal, setShowModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState<TaxProfile | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const handleImportDefaults = async () => {
        if (!confirm('¿Crear perfiles de impuesto por defecto? (IVA General 16%, Exento, Reducido 8%, Suntuario 31%)')) return;
        setImportLoading(true);
        setActionError(null);
        const result = await createDefaultTaxProfiles();
        if (!result.success) {
            setActionError(result.error || 'Error al crear perfiles');
        }
        setImportLoading(false);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-800">Perfiles de Impuesto</h3>
                    <p className="text-sm text-gray-500">Configuración de IVA y otros impuestos</p>
                </div>
                <div className="flex gap-2">
                    {taxProfiles.length === 0 && (
                        <button
                            onClick={handleImportDefaults}
                            disabled={importLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                            {importLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            Crear por Defecto
                        </button>
                    )}
                    <button
                        onClick={() => { setEditingProfile(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-teal-500/25"
                    >
                        <Plus size={16} />
                        Nuevo
                    </button>
                </div>
            </div>

            {/* Error */}
            {actionError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    <AlertCircle size={16} />
                    {actionError}
                    <button onClick={() => setActionError(null)} className="ml-auto"><X size={16} /></button>
                </div>
            )}

            {/* Info */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                <p><strong>Nota:</strong> El IVA y otros impuestos son configurables. Cuando el gobierno cambie las tasas, puedes actualizarlas aquí.</p>
            </div>

            {/* Lista */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div className="col-span-full p-8 text-center">
                        <Loader2 size={24} className="mx-auto text-gray-400 animate-spin" />
                    </div>
                ) : taxProfiles.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-gray-500 border border-gray-200 rounded-xl">
                        <Percent size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>No hay perfiles de impuesto</p>
                        <p className="text-sm">Crea los perfiles por defecto o agrega uno nuevo</p>
                    </div>
                ) : (
                    taxProfiles.map(profile => (
                        <div
                            key={profile.id}
                            className={`p-4 rounded-xl border ${profile.is_default ? 'border-teal-300 bg-teal-50' : 'border-gray-200 bg-white'}`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-gray-900">{profile.name}</h4>
                                        {profile.is_default && (
                                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                                                Predeterminado
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-2xl font-bold text-gray-700 mt-2">{profile.rate}%</p>
                                </div>
                                <button
                                    onClick={() => { setEditingProfile(profile); setShowModal(true); }}
                                    className="p-2 rounded-lg hover:bg-gray-100"
                                >
                                    <Edit2 size={16} className="text-gray-400" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <TaxProfileFormModal
                    profile={editingProfile}
                    onClose={() => { setShowModal(false); setEditingProfile(null); }}
                    onSave={async (data) => {
                        if (editingProfile) {
                            return await updateTaxProfile(editingProfile.id, data);
                        } else {
                            return await createTaxProfile(data);
                        }
                    }}
                />
            )}
        </div>
    );
}

function TaxProfileFormModal({
    profile,
    onClose,
    onSave
}: {
    profile: TaxProfile | null;
    onClose: () => void;
    onSave: (data: CreateTaxProfileData) => Promise<{ success: boolean; error?: string }>;
}) {
    const [formData, setFormData] = useState<CreateTaxProfileData>({
        name: profile?.name || '',
        rate: profile?.rate || 0,
        is_default: profile?.is_default || false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await onSave(formData);

        if (result.success) {
            onClose();
        } else {
            setError(result.error || 'Error al guardar');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {profile ? 'Editar Perfil' : 'Nuevo Perfil de Impuesto'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="IVA General"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tasa (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.rate}
                                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none pr-10"
                            />
                            <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_default"
                            checked={formData.is_default}
                            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                            className="rounded border-gray-300 text-teal-500 focus:ring-teal-400"
                        />
                        <label htmlFor="is_default" className="text-sm text-gray-700">Usar como predeterminado</label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg shadow-teal-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            {profile ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
