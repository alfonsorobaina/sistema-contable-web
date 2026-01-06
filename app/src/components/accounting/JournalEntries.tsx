import { useState } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { useCompany } from '../../context/CompanyContext';
import type { CreateJournalEntryData } from '../../types/accounting';
import {
    Plus,
    Loader2,
    FileText,
    Calendar,
    X,
    Check,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Trash2
} from 'lucide-react';

export default function JournalEntries() {
    const { activeCompany } = useCompany();
    const { journalEntries, accounts, loadingEntries, createJournalEntry, refreshJournalEntries } = useAccounting();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

    const isAdmin = activeCompany?.role === 'admin' || activeCompany?.role === 'accountant';
    const leafAccounts = accounts.filter(a => !a.is_parent && a.is_active);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-VE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; color: string }> = {
            draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-600' },
            posted: { label: 'Contabilizado', color: 'bg-emerald-100 text-emerald-700' },
            cancelled: { label: 'Anulado', color: 'bg-red-100 text-red-600' }
        };
        return badges[status] || badges.draft;
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-800">Asientos Contables</h3>
                    <p className="text-sm text-gray-500">{journalEntries.length} asientos</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        disabled={leafAccounts.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all disabled:opacity-50"
                    >
                        <Plus size={16} />
                        Nuevo Asiento
                    </button>
                )}
            </div>

            {leafAccounts.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                    Necesitas crear cuentas en el Plan de Cuentas antes de registrar asientos.
                </div>
            )}

            {/* Lista */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                {loadingEntries ? (
                    <div className="p-8 text-center">
                        <Loader2 size={24} className="mx-auto text-gray-400 animate-spin" />
                    </div>
                ) : journalEntries.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>No hay asientos registrados</p>
                    </div>
                ) : (
                    journalEntries.map((entry) => {
                        const isExpanded = expandedEntry === entry.id;
                        const totalDebit = entry.lines?.reduce((sum, l) => sum + (l.debit || 0), 0) || 0;
                        const badge = getStatusBadge(entry.status);

                        return (
                            <div key={entry.id} className="border-b border-gray-100 last:border-0">
                                {/* Header */}
                                <button
                                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium">
                                        #{entry.entry_number}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{entry.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Calendar size={12} />
                                            {formatDate(entry.entry_date)}
                                            {entry.reference && <span>• Ref: {entry.reference}</span>}
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                                        {badge.label}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {activeCompany?.currency_symbol} {formatCurrency(totalDebit)}
                                    </span>
                                    {isExpanded ? (
                                        <ChevronUp size={16} className="text-gray-400" />
                                    ) : (
                                        <ChevronDown size={16} className="text-gray-400" />
                                    )}
                                </button>

                                {/* Detalles */}
                                {isExpanded && entry.lines && (
                                    <div className="px-4 pb-4">
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-gray-500 text-xs uppercase">
                                                        <th className="text-left pb-2">Cuenta</th>
                                                        <th className="text-right pb-2">Debe</th>
                                                        <th className="text-right pb-2">Haber</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {entry.lines.map((line) => (
                                                        <tr key={line.id} className="border-t border-gray-200">
                                                            <td className="py-2 text-gray-700">
                                                                {(line.account as any)?.code || ''} - {(line.account as any)?.name || 'Cuenta'}
                                                            </td>
                                                            <td className="py-2 text-right text-gray-900">
                                                                {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                                            </td>
                                                            <td className="py-2 text-right text-gray-900">
                                                                {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="border-t-2 border-gray-300 font-medium">
                                                        <td className="pt-2 text-gray-600">TOTALES</td>
                                                        <td className="pt-2 text-right">{formatCurrency(totalDebit)}</td>
                                                        <td className="pt-2 text-right">{formatCurrency(totalDebit)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal Crear */}
            {showCreateModal && (
                <JournalEntryFormModal
                    accounts={leafAccounts}
                    currencySymbol={activeCompany?.currency_symbol || 'Bs.'}
                    onClose={() => setShowCreateModal(false)}
                    onSave={async (data) => {
                        const result = await createJournalEntry(data);
                        if (result.success) {
                            await refreshJournalEntries();
                        }
                        return result;
                    }}
                />
            )}
        </div>
    );
}

// Modal para crear asiento
function JournalEntryFormModal({
    accounts,
    currencySymbol,
    onClose,
    onSave
}: {
    accounts: any[];
    currencySymbol: string;
    onClose: () => void;
    onSave: (data: CreateJournalEntryData) => Promise<{ success: boolean; error?: string }>;
}) {
    const [formData, setFormData] = useState({
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        reference: ''
    });
    const [lines, setLines] = useState<{ account_id: string; debit: number; credit: number }[]>([
        { account_id: '', debit: 0, credit: 0 },
        { account_id: '', debit: 0, credit: 0 }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;

    const addLine = () => {
        setLines([...lines, { account_id: '', debit: 0, credit: 0 }]);
    };

    const removeLine = (index: number) => {
        if (lines.length <= 2) return;
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: string, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };

        // Auto-clear opposite field
        if (field === 'debit' && value > 0) {
            newLines[index].credit = 0;
        } else if (field === 'credit' && value > 0) {
            newLines[index].debit = 0;
        }

        setLines(newLines);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) {
            setError('El asiento debe estar balanceado');
            return;
        }

        const validLines = lines.filter(l => l.account_id && (l.debit > 0 || l.credit > 0));
        if (validLines.length < 2) {
            setError('El asiento debe tener al menos 2 líneas');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await onSave({
            entry_date: formData.entry_date,
            description: formData.description,
            reference: formData.reference || undefined,
            lines: validLines
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Nuevo Asiento Contable</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                            <input
                                type="date"
                                required
                                value={formData.entry_date}
                                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia (opcional)</label>
                            <input
                                type="text"
                                value={formData.reference}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                placeholder="Factura #001"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Compra de suministros"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                        />
                    </div>

                    {/* Líneas */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">Líneas del Asiento</label>
                            <button
                                type="button"
                                onClick={addLine}
                                className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                            >
                                <Plus size={14} />
                                Agregar línea
                            </button>
                        </div>
                        <div className="space-y-2">
                            {lines.map((line, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <select
                                        value={line.account_id}
                                        onChange={(e) => updateLine(index, 'account_id', e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none text-sm"
                                    >
                                        <option value="">Seleccionar cuenta...</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={line.debit || ''}
                                        onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                                        placeholder="Debe"
                                        className="w-28 px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none text-sm text-right"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={line.credit || ''}
                                        onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                                        placeholder="Haber"
                                        className="w-28 px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none text-sm text-right"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeLine(index)}
                                        disabled={lines.length <= 2}
                                        className="p-2 rounded-lg hover:bg-red-100 disabled:opacity-30"
                                    >
                                        <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totales */}
                    <div className={`flex items-center justify-end gap-8 p-3 rounded-xl ${isBalanced ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Total Debe</p>
                            <p className="font-semibold">{currencySymbol} {totalDebit.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Total Haber</p>
                            <p className="font-semibold">{currencySymbol} {totalCredit.toFixed(2)}</p>
                        </div>
                        <div className={`text-sm font-medium ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isBalanced ? '✓ Balanceado' : '✗ Desbalanceado'}
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
                            disabled={loading || !isBalanced}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg shadow-teal-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            Crear Asiento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
