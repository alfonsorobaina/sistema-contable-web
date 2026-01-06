import { useState } from 'react';
import { usePayroll } from '../../context/PayrollContext';
import { CONCEPT_TYPES } from '../../types/payroll';
import type { PayrollConcept } from '../../types/payroll';
import { Edit2, Loader2, Save, X, Plus, RotateCcw } from 'lucide-react';

export default function PayrollConcepts() {
    const { concepts, loading, updateConcept, createConcept } = usePayroll();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(0);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleStartEdit = (concept: PayrollConcept) => {
        setEditingId(concept.id);
        const val = concept.is_fixed_amount ? concept.amount : concept.amount * 100;
        setEditValue(val);
    };

    const handleSave = async (concept: PayrollConcept) => {
        const newVal = concept.is_fixed_amount ? editValue : editValue / 100;
        await updateConcept(concept.id, { amount: newVal });
        setEditingId(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex-1">
                    <p>Aquí puedes configurar los porcentajes y montos fijos de los conceptos de ley (IVSS, FAOV, etc).</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => updateConcept('init', {})}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        title="Restaurar conceptos de ley a sus valores originales"
                    >
                        <RotateCcw size={16} /> Restaurar Defaults
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
                    >
                        <Plus size={16} /> Nuevo Concepto
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-700">Concepto</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Tipo</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Valor Configurado</th>
                            <th className="px-4 py-3 font-semibold text-gray-700 w-24">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="mx-auto animate-spin" /></td></tr>
                        ) : concepts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    <p className="mb-2">No hay conceptos configurados.</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="text-teal-600 font-medium hover:underline"
                                    >
                                        Recargar página para intentar inicializar
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            concepts.map(concept => (
                                <tr key={concept.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium text-gray-900">{concept.name}</div>
                                            {concept.system_code && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200" title="Concepto de Sistema (No eliminable)">
                                                    SISTEMA
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">{concept.code}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium 
                                            ${concept.concept_type === 'earning' ? 'bg-green-100 text-green-700' :
                                                concept.concept_type === 'deduction' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {CONCEPT_TYPES.find(t => t.value === concept.concept_type)?.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono">
                                        {editingId === concept.id ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    className="w-20 border rounded px-1 py-0.5 text-right"
                                                    value={editValue}
                                                    step={concept.is_fixed_amount ? "0.01" : "0.01"}
                                                    onChange={e => setEditValue(parseFloat(e.target.value))}
                                                />
                                                <span className="text-gray-500">{concept.is_fixed_amount ? 'Bs' : '%'}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-700">
                                                {concept.is_fixed_amount
                                                    ? `Bs ${concept.amount.toLocaleString()}`
                                                    : `${(concept.amount * 100).toFixed(2)}%`}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {editingId === concept.id ? (
                                            <div className="flex gap-1">
                                                <button onClick={() => handleSave(concept)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={16} /></button>
                                                <button onClick={() => setEditingId(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleStartEdit(concept)} className="p-1 text-gray-400 hover:text-teal-600 hover:bg-gray-100 rounded">
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showCreateModal && (
                <CreateConceptModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={createConcept}
                />
            )}
        </div>
    );
}

function CreateConceptModal({ onClose, onCreate }: { onClose: () => void, onCreate: (data: any) => Promise<any> }) {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        concept_type: 'earning',
        is_fixed_amount: false,
        amount: 0
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // If percentage, divide by 100
        const dataToSave = {
            ...formData,
            amount: formData.is_fixed_amount ? formData.amount : formData.amount / 100
        };
        const res = await onCreate(dataToSave);
        setLoading(false);
        if (res.success) onClose();
        else alert(res.error);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
                <h3 className="text-lg font-bold mb-4">Nuevo Concepto de Nómina</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre</label>
                        <input required className="w-full border rounded-lg p-2" placeholder="Ej: Bono de Productividad" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Código</label>
                        <input required className="w-full border rounded-lg p-2 font-mono uppercase" placeholder="Ej: BONO_PROD" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo</label>
                        <select className="w-full border rounded-lg p-2" value={formData.concept_type} onChange={e => setFormData({ ...formData, concept_type: e.target.value })}>
                            {CONCEPT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_fixed" checked={formData.is_fixed_amount} onChange={e => setFormData({ ...formData, is_fixed_amount: e.target.checked })} />
                        <label htmlFor="is_fixed" className="text-sm">Es monto fijo (Bs)</label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{formData.is_fixed_amount ? 'Monto (Bs)' : 'Porcentaje (%)'}</label>
                        <input
                            type="number"
                            required
                            step="0.01"
                            className="w-full border rounded-lg p-2"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {formData.is_fixed_amount ? 'Ej: 1500.00' : 'Ej: 5 para 5%'}
                        </p>
                    </div>

                    <div className="flex gap-2 pt-4 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2">
                            {loading && <Loader2 className="animate-spin" size={16} />} Crear
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
