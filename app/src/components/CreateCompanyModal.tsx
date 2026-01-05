import { useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import { X, Building2, MapPin, Phone, Mail, DollarSign, Loader2 } from 'lucide-react';

interface CreateCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateCompanyModal({ isOpen, onClose }: CreateCompanyModalProps) {
    const { createCompany } = useCompany();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        tax_id: '',
        address: '',
        phone: '',
        email: '',
        currency_symbol: 'Bs.'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await createCompany(formData);

        if (result.success) {
            setFormData({
                name: '',
                tax_id: '',
                address: '',
                phone: '',
                email: '',
                currency_symbol: 'Bs.'
            });
            onClose();
        } else {
            setError(result.error || 'Error al crear empresa');
        }
        setLoading(false);
    };

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Building2 size={22} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Nueva Empresa</h2>
                                <p className="text-teal-100 text-sm">Configura tu espacio de trabajo</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        >
                            <X size={18} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Nombre de empresa */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nombre de la Empresa *
                        </label>
                        <div className="relative">
                            <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                placeholder="Mi Empresa C.A."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* RIF / Tax ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            RIF / Identificación Fiscal *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.tax_id}
                            onChange={(e) => updateField('tax_id', e.target.value)}
                            placeholder="J-12345678-9"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all"
                        />
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Dirección
                        </label>
                        <div className="relative">
                            <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                            <textarea
                                value={formData.address}
                                onChange={(e) => updateField('address', e.target.value)}
                                placeholder="Av. Principal, Edificio Centro, Piso 5"
                                rows={2}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Teléfono y Email */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Teléfono
                            </label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => updateField('phone', e.target.value)}
                                    placeholder="+58 412 1234567"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    placeholder="contacto@empresa.com"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Símbolo de moneda */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Símbolo de Moneda
                        </label>
                        <div className="relative">
                            <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                value={formData.currency_symbol}
                                onChange={(e) => updateField('currency_symbol', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all appearance-none bg-white"
                            >
                                <option value="Bs.">Bs. - Bolívares</option>
                                <option value="$">$ - Dólares</option>
                                <option value="€">€ - Euros</option>
                                <option value="COP">COP - Pesos Colombianos</option>
                                <option value="MXN">MXN - Pesos Mexicanos</option>
                            </select>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                'Crear Empresa'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
