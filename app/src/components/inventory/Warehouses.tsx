import { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import type { Warehouse, CreateWarehouseData } from '../../types/inventory';
import {
    Plus,
    Loader2,
    Edit2,
    Trash2,
    X,
    Check,
    AlertCircle,
    Warehouse as WarehouseIcon
} from 'lucide-react';

export default function Warehouses() {
    const { warehouses, loading, createWarehouse, updateWarehouse, deleteWarehouse } = useInventory();
    const [showModal, setShowModal] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const handleDelete = async (warehouse: Warehouse) => {
        if (!confirm(`¿Eliminar almacén "${warehouse.name}"?`)) return;
        const result = await deleteWarehouse(warehouse.id);
        if (!result.success) {
            setActionError(result.error || 'Error al eliminar');
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-800">Almacenes</h3>
                    <p className="text-sm text-gray-500">{warehouses.length} registrados</p>
                </div>
                <button
                    onClick={() => { setEditingWarehouse(null); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium shadow-lg shadow-purple-500/25"
                >
                    <Plus size={16} />
                    Nuevo Almacén
                </button>
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
                ) : warehouses.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <WarehouseIcon size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>No hay almacenes registrados</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Ubicación</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600">Por Defecto</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {warehouses.map(warehouse => (
                                <tr key={warehouse.id} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-gray-600">{warehouse.code}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{warehouse.name}</td>
                                    <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                                        {warehouse.location || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {warehouse.is_default && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                                Sí
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            <button
                                                onClick={() => { setEditingWarehouse(warehouse); setShowModal(true); }}
                                                className="p-1.5 rounded-lg hover:bg-gray-200"
                                            >
                                                <Edit2 size={14} className="text-gray-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(warehouse)}
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
                <WarehouseFormModal
                    warehouse={editingWarehouse}
                    onClose={() => { setShowModal(false); setEditingWarehouse(null); }}
                    onSave={async (data) => {
                        if (editingWarehouse) {
                            return await updateWarehouse(editingWarehouse.id, data);
                        } else {
                            return await createWarehouse(data);
                        }
                    }}
                />
            )}
        </div>
    );
}

function WarehouseFormModal({
    warehouse,
    onClose,
    onSave
}: {
    warehouse: Warehouse | null;
    onClose: () => void;
    onSave: (data: CreateWarehouseData) => Promise<{ success: boolean; error?: string }>;
}) {
    const [formData, setFormData] = useState<CreateWarehouseData>({
        code: warehouse?.code || '',
        name: warehouse?.name || '',
        location: warehouse?.location || '',
        is_default: warehouse?.is_default ?? false
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
                        {warehouse ? 'Editar Almacén' : 'Nuevo Almacén'}
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono"
                            />
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer pb-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_default}
                                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                    className="rounded border-gray-300 text-purple-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Por Defecto</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                        <input
                            type="text"
                            value={formData.location || ''}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Dirección o área"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            {warehouse ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
