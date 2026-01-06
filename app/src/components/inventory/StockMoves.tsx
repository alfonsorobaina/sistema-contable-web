import { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { MOVE_TYPE_LABELS } from '../../types/inventory';
import type { StockMove, StockInData, StockOutData } from '../../types/inventory';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Loader2,
    X,
    Check,
    AlertCircle,
    ArrowLeftRight
} from 'lucide-react';

export default function StockMoves() {
    const { stockMoves, products, warehouses, stockIn, stockOut } = useInventory();
    const [showInModal, setShowInModal] = useState(false);
    const [showOutModal, setShowOutModal] = useState(false);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-VE', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(num);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-800">Movimientos de Stock</h3>
                    <p className="text-sm text-gray-500">{stockMoves.length} movimientos</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowInModal(true)}
                        disabled={products.length === 0 || warehouses.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium shadow-lg disabled:opacity-50"
                    >
                        <ArrowDownCircle size={16} />
                        Entrada
                    </button>
                    <button
                        onClick={() => setShowOutModal(true)}
                        disabled={products.length === 0 || warehouses.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-medium shadow-lg disabled:opacity-50"
                    >
                        <ArrowUpCircle size={16} />
                        Salida
                    </button>
                </div>
            </div>

            {products.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                    Primero debes registrar productos en la pestaña "Productos".
                </div>
            )}

            {/* Lista */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                {stockMoves.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <ArrowLeftRight size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>No hay movimientos registrados</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Almacén</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600">Tipo</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Cantidad</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Costo Unit.</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stockMoves.map(move => {
                                const product = move.product as any;
                                const warehouse = move.warehouse as any;
                                const typeInfo = MOVE_TYPE_LABELS[move.move_type];
                                return (
                                    <tr key={move.id} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-500">{formatDate(move.move_date)}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{product?.name}</p>
                                            <p className="text-xs text-gray-500">{product?.code}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                                            {warehouse?.name}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                                                {typeInfo.label}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 text-right font-medium ${move.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {move.quantity > 0 ? '+' : ''}{formatNumber(move.quantity)}
                                        </td>
                                        <td className="px-4 py-3 text-right hidden lg:table-cell text-gray-600">
                                            {formatNumber(move.unit_cost)}
                                        </td>
                                        <td className="px-4 py-3 text-right hidden lg:table-cell font-medium">
                                            {formatNumber(move.total_cost)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modales */}
            {showInModal && <StockInModal products={products} warehouses={warehouses} onClose={() => setShowInModal(false)} onSave={stockIn} />}
            {showOutModal && <StockOutModal products={products} warehouses={warehouses} onClose={() => setShowOutModal(false)} onSave={stockOut} />}
        </div>
    );
}

function StockInModal({
    products,
    warehouses,
    onClose,
    onSave
}: {
    products: any[];
    warehouses: any[];
    onClose: () => void;
    onSave: (data: StockInData) => Promise<{ success: boolean; error?: string }>;
}) {
    const [formData, setFormData] = useState<StockInData>({
        product_id: '',
        warehouse_id: warehouses.find(w => w.is_default)?.id || '',
        quantity: 0,
        unit_cost: 0,
        reference: '',
        move_date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.quantity <= 0) {
            setError('La cantidad debe ser mayor a cero');
            return;
        }
        setLoading(true);
        setError(null);

        const result = await onSave(formData);

        if (result.success) {
            onClose();
        } else {
            setError(result.error || 'Error al registrar');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Entrada de Stock</h2>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                        <select
                            required
                            value={formData.product_id}
                            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        >
                            <option value="">Seleccionar...</option>
                            {products.filter(p => p.is_tracked).map(p => (
                                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Almacén</label>
                        <select
                            required
                            value={formData.warehouse_id}
                            onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        >
                            <option value="">Seleccionar...</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.quantity || ''}
                                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.unit_cost || ''}
                                onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                        <input
                            type="text"
                            value={formData.reference || ''}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="Factura, orden, etc."
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            Registrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function StockOutModal({
    products,
    warehouses,
    onClose,
    onSave
}: {
    products: any[];
    warehouses: any[];
    onClose: () => void;
    onSave: (data: StockOutData) => Promise<{ success: boolean; error?: string }>;
}) {
    const [formData, setFormData] = useState<StockOutData>({
        product_id: '',
        warehouse_id: warehouses.find(w => w.is_default)?.id || '',
        quantity: 0,
        reference: '',
        move_date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.quantity <= 0) {
            setError('La cantidad debe ser mayor a cero');
            return;
        }
        setLoading(true);
        setError(null);

        const result = await onSave(formData);

        if (result.success) {
            onClose();
        } else {
            setError(result.error || 'Error al registrar');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Salida de Stock</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            <AlertCircle size={16} className="inline mr-2" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                        <select
                            required
                            value={formData.product_id}
                            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        >
                            <option value="">Seleccionar...</option>
                            {products.filter(p => p.is_tracked).map(p => (
                                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Almacén</label>
                        <select
                            required
                            value={formData.warehouse_id}
                            onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        >
                            <option value="">Seleccionar...</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.quantity || ''}
                            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                        <input
                            type="text"
                            value={formData.reference || ''}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="Factura, orden, etc."
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            Registrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
