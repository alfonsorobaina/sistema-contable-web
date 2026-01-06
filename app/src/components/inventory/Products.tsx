import { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { UNIT_OF_MEASURES } from '../../types/inventory';
import type { Product, CreateProductData } from '../../types/inventory';
import {
    Plus,
    Search,
    Loader2,
    Edit2,
    Trash2,
    X,
    Check,
    AlertCircle,
    Package
} from 'lucide-react';

export default function Products() {
    const { products, loading, createProduct, updateProduct, deleteProduct } = useInventory();
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (product: Product) => {
        if (!confirm(`¿Eliminar producto "${product.name}"?`)) return;
        const result = await deleteProduct(product.id);
        if (!result.success) {
            setActionError(result.error || 'Error al eliminar');
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Productos</h3>
                    <p className="text-sm text-gray-500">{products.length} registrados</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por código o nombre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none text-sm"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingProduct(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium shadow-lg shadow-purple-500/25"
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
                ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Package size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>{searchQuery ? 'No se encontraron productos' : 'No hay productos registrados'}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600 hidden md:table-cell">UM</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Costo Prom.</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600">Inventario</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-gray-600">{product.code}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{product.name}</p>
                                        {product.description && (
                                            <p className="text-xs text-gray-500">{product.description}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center hidden md:table-cell text-gray-500">
                                        {product.unit_of_measure}
                                    </td>
                                    <td className="px-4 py-3 text-right hidden lg:table-cell text-gray-600">
                                        {product.current_cost.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.is_tracked ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {product.is_tracked ? 'Sí' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            <button
                                                onClick={() => { setEditingProduct(product); setShowModal(true); }}
                                                className="p-1.5 rounded-lg hover:bg-gray-200"
                                            >
                                                <Edit2 size={14} className="text-gray-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product)}
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
                <ProductFormModal
                    product={editingProduct}
                    onClose={() => { setShowModal(false); setEditingProduct(null); }}
                    onSave={async (data) => {
                        if (editingProduct) {
                            return await updateProduct(editingProduct.id, data);
                        } else {
                            return await createProduct(data);
                        }
                    }}
                />
            )}
        </div>
    );
}

function ProductFormModal({
    product,
    onClose,
    onSave
}: {
    product: Product | null;
    onClose: () => void;
    onSave: (data: CreateProductData) => Promise<{ success: boolean; error?: string }>;
}) {
    const [formData, setFormData] = useState<CreateProductData>({
        code: product?.code || '',
        name: product?.name || '',
        description: product?.description || '',
        category: product?.category || '',
        unit_of_measure: product?.unit_of_measure || 'UND',
        is_tracked: product?.is_tracked ?? true,
        cost_method: product?.cost_method || 'average',
        sale_price: product?.sale_price || 0,
        notes: product?.notes || ''
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {product ? 'Editar Producto' : 'Nuevo Producto'}
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">UM</label>
                            <select
                                value={formData.unit_of_measure}
                                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            >
                                {UNIT_OF_MEASURES.map(um => (
                                    <option key={um.value} value={um.value}>{um.label}</option>
                                ))}
                            </select>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_tracked}
                                onChange={(e) => setFormData({ ...formData, is_tracked: e.target.checked })}
                                className="rounded border-gray-300 text-purple-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Maneja inventario</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Si está activo, se controlarán entradas y salidas de stock</p>
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
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            {product ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
