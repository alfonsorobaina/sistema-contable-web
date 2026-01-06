import { useState } from 'react';
import { usePayables } from '../../context/PayablesContext';
import { RIF_TYPES, VENEZUELA_STATES, validateRIF, formatRIF } from '../../types/invoicing';
import type { Supplier, CreateSupplierData } from '../../types/payables';
import type { RifType } from '../../types/invoicing';
import {
    Plus,
    Search,
    Loader2,
    Edit2,
    Trash2,
    X,
    Check,
    AlertCircle,
    Building2,
    Phone,
    Mail,
    CreditCard
} from 'lucide-react';

export default function Suppliers() {
    const { suppliers, loading, createSupplier, updateSupplier, deleteSupplier } = usePayables();
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rif.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (supplier: Supplier) => {
        if (!confirm(`¿Eliminar proveedor "${supplier.name}"?`)) return;
        const result = await deleteSupplier(supplier.id);
        if (!result.success) {
            setActionError(result.error || 'Error al eliminar');
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Proveedores</h3>
                    <p className="text-sm text-gray-500">{suppliers.length} registrados</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o RIF..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none text-sm"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingSupplier(null); setShowModal(true); }}
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

            {/* Lista */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 size={24} className="mx-auto text-gray-400 animate-spin" />
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Building2 size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>{searchQuery ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">RIF</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Contacto</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Banco</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.map(supplier => (
                                <tr key={supplier.id} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-gray-600">
                                        {formatRIF(supplier.rif)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{supplier.name}</p>
                                        {supplier.trade_name && (
                                            <p className="text-xs text-gray-500">{supplier.trade_name}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                                            {supplier.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={12} />{supplier.phone}
                                                </span>
                                            )}
                                            {supplier.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail size={12} />{supplier.email}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        {supplier.bank_name ? (
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <CreditCard size={12} />
                                                {supplier.bank_name}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            <button
                                                onClick={() => { setEditingSupplier(supplier); setShowModal(true); }}
                                                className="p-1.5 rounded-lg hover:bg-gray-200"
                                            >
                                                <Edit2 size={14} className="text-gray-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supplier)}
                                                className="p-1.5 rounded-lg hover:bg-red-100"
                                            >
                                                <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <SupplierFormModal
                    supplier={editingSupplier}
                    onClose={() => { setShowModal(false); setEditingSupplier(null); }}
                    onSave={async (data) => {
                        if (editingSupplier) {
                            return await updateSupplier(editingSupplier.id, data);
                        } else {
                            return await createSupplier(data);
                        }
                    }}
                />
            )}
        </div>
    );
}

function SupplierFormModal({
    supplier,
    onClose,
    onSave
}: {
    supplier: Supplier | null;
    onClose: () => void;
    onSave: (data: CreateSupplierData) => Promise<{ success: boolean; error?: string }>;
}) {
    const [formData, setFormData] = useState<CreateSupplierData>({
        rif_type: supplier?.rif_type || 'J',
        rif: supplier?.rif || '',
        name: supplier?.name || '',
        trade_name: supplier?.trade_name || '',
        address: supplier?.address || '',
        city: supplier?.city || '',
        state: supplier?.state || '',
        phone: supplier?.phone || '',
        email: supplier?.email || '',
        bank_name: supplier?.bank_name || '',
        bank_account: supplier?.bank_account || '',
        bank_account_type: supplier?.bank_account_type || undefined,
        notes: supplier?.notes || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const fullRif = formData.rif_type + formData.rif.replace(/[-\s]/g, '');
        if (!validateRIF(fullRif)) {
            setError('RIF inválido. Formato: 9 dígitos después de la letra');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await onSave({
            ...formData,
            rif: fullRif
        });

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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* RIF */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">RIF</label>
                        <div className="flex gap-2">
                            <select
                                value={formData.rif_type}
                                onChange={(e) => setFormData({ ...formData, rif_type: e.target.value as RifType })}
                                className="w-24 px-3 py-2 rounded-xl border border-gray-200"
                            >
                                {Object.entries(RIF_TYPES).map(([type, label]) => (
                                    <option key={type} value={type}>{type} - {label}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                required
                                value={formData.rif.replace(formData.rif_type, '')}
                                onChange={(e) => setFormData({ ...formData, rif: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                                placeholder="123456789"
                                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 font-mono"
                            />
                        </div>
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        />
                    </div>

                    {/* Estado */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                            <input
                                type="text"
                                value={formData.city || ''}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                                value={formData.state || ''}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            >
                                <option value="">Seleccionar...</option>
                                {VENEZUELA_STATES.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Teléfono y Email */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input
                                type="tel"
                                value={formData.phone || ''}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            />
                        </div>
                    </div>

                    {/* Banco */}
                    <div className="pt-2 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-3">Datos Bancarios (para pagos)</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Banco</label>
                                <input
                                    type="text"
                                    value={formData.bank_name || ''}
                                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                    placeholder="Banco Venezuela"
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                                <select
                                    value={formData.bank_account_type || ''}
                                    onChange={(e) => setFormData({ ...formData, bank_account_type: e.target.value as 'corriente' | 'ahorro' || undefined })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="corriente">Corriente</option>
                                    <option value="ahorro">Ahorro</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-2">
                            <label className="block text-sm text-gray-600 mb-1">Número de Cuenta</label>
                            <input
                                type="text"
                                value={formData.bank_account || ''}
                                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                                placeholder="0102-0000-00-0000000000"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono"
                            />
                        </div>
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
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            {supplier ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
