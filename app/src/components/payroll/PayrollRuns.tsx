import { useState } from 'react';
import { usePayroll } from '../../context/PayrollContext';
import { Plus, Calendar, CheckCircle, Loader2 } from 'lucide-react';

export default function PayrollRuns() {
    const { payrollRuns, runPayroll, approvePayroll } = usePayroll();
    const [showRunModal, setShowRunModal] = useState(false);

    // Render list
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Historial de Nóminas</h3>
                <button
                    onClick={() => setShowRunModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow-lg"
                >
                    <Plus size={16} />
                    Generar Nómina
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {payrollRuns.map(run => (
                    <div key={run.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-gray-900">{run.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <Calendar size={12} />
                                    {run.period_start} - {run.period_end}
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                ${run.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    run.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                                {run.status === 'approved' ? 'Aprobada' : 'Borrador'}
                            </span>
                        </div>

                        <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total Asignaciones</span>
                                <span className="font-medium text-green-600">{run.total_earnings.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total Deducciones</span>
                                <span className="font-medium text-red-600">({run.total_deductions.toLocaleString()})</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-dashed border-gray-200">
                                <span className="font-semibold text-gray-700">Neto a Pagar</span>
                                <span className="font-bold text-gray-900 text-lg">{run.net_total.toLocaleString()}</span>
                            </div>
                        </div>

                        {run.status === 'draft' && (
                            <button
                                onClick={async () => {
                                    if (confirm('¿Aprobar nómina? Esto generará los asientos contables.')) {
                                        await approvePayroll(run.id);
                                    }
                                }}
                                className="mt-4 w-full py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={16} /> Aprobar
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {showRunModal && (
                <RunPayrollModal onClose={() => setShowRunModal(false)} onRun={runPayroll} />
            )}
        </div>
    );
}

function RunPayrollModal({ onClose, onRun }: any) {
    const [dates, setDates] = useState({ start: '', end: '', name: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await onRun(dates.start, dates.end, dates.name);
        setLoading(false);
        if (res.success) onClose();
        else alert(res.error);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
                <h3 className="text-lg font-bold mb-4">Generar Nueva Nómina</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre (Opcional)</label>
                        <input className="w-full border rounded-lg p-2" placeholder="Ej: Quincena 1 Enero" value={dates.name} onChange={e => setDates({ ...dates, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Desde</label>
                            <input type="date" required className="w-full border rounded-lg p-2" value={dates.start} onChange={e => setDates({ ...dates, start: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Hasta</label>
                            <input type="date" required className="w-full border rounded-lg p-2" value={dates.end} onChange={e => setDates({ ...dates, end: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-4 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2">
                            {loading && <Loader2 className="animate-spin" size={16} />} Generar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
