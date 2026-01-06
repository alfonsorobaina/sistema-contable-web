import { useState } from 'react';
import { useInvoicing } from '../../context/InvoicingContext';
import { RIF_TYPES, VENEZUELA_STATES, validateRIF, formatRIF } from '../../types/invoicing';
import type { Customer, CreateCustomerData, RifType } from '../../types/invoicing';
import {
    Plus,
    Search,
    Loader2,
    Edit2,
    Trash2,
    X,
    Check,
    AlertCircle,
    User,
    MapPin,
    Phone,
    Mail
} from 'lucide-react';

export default function Customers() {
    const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useInvoicing();
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.rif.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (customer: Customer) => {
        if (!confirm(`¿Eliminar cliente "${customer.name}"?`)) return;
        const result = await deleteCustomer(customer.id);
        if (!result.success) {
            setActionError(result.error || 'Error al eliminar');
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Clientes</h3>
                    <p className="text-sm text-gray-500">{customers.length} registrados</p>
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
                        onClick={() => { setEditingCustomer(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all"
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
                ) : filteredCustomers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <User size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>{searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">RIF</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Contacto</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Estado</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(customer => (
                                <tr key={customer.id} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-gray-600">
                                        {formatRIF(customer.rif)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{customer.name}</p>
                                        {customer.trade_name && (
                                            <p className="text-xs text-gray-500">{customer.trade_name}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                                            {customer.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={12} />{customer.phone}
                                                </span>
                                            )}
                                            {customer.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail size={12} />{customer.email}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500">
                                        {customer.state || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            <button
                                                onClick={() => { setEditingCustomer(customer); setShowModal(true); }}
                                                className="p-1.5 rounded-lg hover:bg-gray-200"
                                            >
                                                <Edit2 size={14} className="text-gray-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer)}
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
                <CustomerFormModal
                    customer={editingCustomer}
                    onClose={() => { setShowModal(false); setEditingCustomer(null); }}
                    onSave={async (data) => {
                        if (editingCustomer) {
                            return await updateCustomer(editingCustomer.id, data);
                        } else {
                            return await createCustomer(data);
                        }
                    }}
                />
            )}
        </div>
    );
}

function CustomerFormModal({
    customer,
    onClose,
    onSave
}: {
    customer: Customer | null;
    onClose: () => void;
    onSave: (data: CreateCustomerData) => Promise<{ success: boolean; error?: string }>;
}) {
    const [formData, setFormData] = useState<CreateCustomerData>({
        rif_type: customer?.rif_type || 'J',
        rif: customer?.rif || '',
        name: customer?.name || '',
        trade_name: customer?.trade_name || '',
        address: customer?.address || '',
        city: customer?.city || '',
        state: customer?.state || '',
        phone: customer?.phone || '',
        email: customer?.email || '',
        notes: customer?.notes || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar RIF
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
                        {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                                className="w-24 px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
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
                                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none font-mono"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Ejemplo: J-12345678-9</p>
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Empresa C.A."
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                        />
                    </div>

                    {/* Nombre comercial */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial (opcional)</label>
                        <input
                            type="text"
                            value={formData.trade_name || ''}
                            onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                        />
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                            <textarea
                                value={formData.address || ''}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={2}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Ciudad y Estado */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                            <input
                                type="text"
                                value={formData.city || ''}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                                value={formData.state || ''}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
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
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    value={formData.phone || ''}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                                />
                            </div>
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
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg shadow-teal-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            {customer ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
