import { useState, useEffect } from 'react';
import { useBanking } from '../../context/BankingContext';
import type { BankAccount } from '../../types/banking';
import {
    Plus,
    Loader2,
    X,
    Check,
    AlertCircle,
    FileCheck
} from 'lucide-react';

export default function BankReconciliations() {
    const { bankAccounts, bankReconciliations, loading, refreshReconciliations } = useBanking();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        refreshReconciliations();
    }, [refreshReconciliations]);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Conciliaciones Bancarias</h3>
                    <p className="text-sm text-gray-500">{bankReconciliations.length} registradas</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-teal-500/25"
                >
                    <Plus size={16} />
                    Nueva Conciliación
                </button>
            </div>

            {/* Lista */}
            <div className="grid gap-4 md:grid-cols-2">
                {loading ? (
                    <div className="col-span-full p-8 text-center">
                        <Loader2 size={24} className="mx-auto text-gray-400 animate-spin" />
                    </div>
                ) : bankReconciliations.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-gray-500">
                        <FileCheck size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>No hay conciliaciones registradas</p>
                    </div>
                ) : (
                    bankReconciliations.map(reconciliation => (
                        <div key={reconciliation.id} className="bg-white border border-gray-200 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-teal-100 rounded-lg">
                                        <FileCheck size={18} className="text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {(reconciliation.bank_account as any)?.bank_name || 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(reconciliation.reconciliation_date).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${reconciliation.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {reconciliation.status === 'completed' ? 'Completada' : 'En Proceso'}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Período:</span>
                                    <span className="text-gray-700">
                                        {new Date(reconciliation.start_date).toLocaleDateString('es-ES')} - {new Date(reconciliation.end_date).toLocaleDateString('es-ES')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Balance Libros:</span>
                                    <span className="font-mono text-gray-700">
                                        ${reconciliation.balance_per_books.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Balance Banco:</span>
                                    <span className="font-mono text-gray-700">
                                        ${reconciliation.balance_per_bank.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-100">
                                    <span className="text-gray-500 font-medium">Diferencia:</span>
                                    <span className={`font-semibold ${Math.abs(reconciliation.difference) < 0.01
                                        ? 'text-emerald-600'
                                        : 'text-amber-600'
                                        }`}>
                                        ${Math.abs(reconciliation.difference).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            {reconciliation.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">{reconciliation.notes}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <ReconciliationModal
                    bankAccounts={bankAccounts}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}

function ReconciliationModal({
    bankAccounts,
    onClose
}: {
    bankAccounts: BankAccount[];
    onClose: () => void;
}) {
    const { bankTransactions, reconcileBank, refreshReconciliations, refreshBankTransactions } = useBanking();
    const [selectedAccount, setSelectedAccount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [balancePerBank, setBalancePerBank] = useState(0);
    const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtrar transacciones pendientes de la cuenta seleccionada
    const pendingTransactions = bankTransactions.filter(
        t => t.bank_account_id === selectedAccount &&
            t.status === 'pending' &&
            (!startDate || t.transaction_date >= startDate) &&
            (!endDate || t.transaction_date <= endDate)
    );

    const toggleTransaction = (id: string) => {
        setSelectedTransactions(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccount || !startDate || !endDate) {
            setError('Por favor completa todos los campos requeridos');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await reconcileBank({
            bank_account_id: selectedAccount,
            reconciliation_date: new Date().toISOString().split('T')[0],
            start_date: startDate,
            end_date: endDate,
            balance_per_bank: balancePerBank,
            transaction_ids: selectedTransactions,
            notes
        });

        if (result.success) {
            await refreshReconciliations();
            await refreshBankTransactions();
            onClose();
        } else {
            setError(result.error || 'Error al conciliar');
        }
        setLoading(false);
    };

    // Calcular balance según libros
    const balancePerBooks = bankAccounts.find(a => a.id === selectedAccount)?.current_balance || 0;
    const difference = balancePerBank - balancePerBooks;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Nueva Conciliación Bancaria</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            <AlertCircle size={16} className="inline mr-2" />
                            {error}
                        </div>
                    )}

                    {/* Selección de Cuenta y Período */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria</label>
                            <select
                                required
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            >
                                <option value="">Seleccionar...</option>
                                {bankAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.bank_name} - {acc.account_number} ({acc.currency} {acc.current_balance.toFixed(2)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                                <input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                                <input
                                    type="date"
                                    required
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Balance según Banco</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={balancePerBank}
                                onChange={(e) => setBalancePerBank(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                                placeholder="Ingresa el balance del estado de cuenta"
                            />
                        </div>
                    </div>

                    {/* Resumen de Balances */}
                    {selectedAccount && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Balance según Libros:</span>
                                <span className="font-semibold text-gray-900">
                                    ${balancePerBooks.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Balance según Banco:</span>
                                <span className="font-semibold text-gray-900">
                                    ${balancePerBank.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="text-gray-600 font-medium">Diferencia:</span>
                                <span className={`font-semibold ${Math.abs(difference) < 0.01 ? 'text-emerald-600' : 'text-amber-600'
                                    }`}>
                                    ${Math.abs(difference).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Transacciones Pendientes */}
                    {selectedAccount && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Transacciones Pendientes ({pendingTransactions.length})
                            </label>
                            <div className="border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
                                {pendingTransactions.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        No hay transacciones pendientes para este período
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {pendingTransactions.map(transaction => (
                                            <label
                                                key={transaction.id}
                                                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTransactions.includes(transaction.id)}
                                                    onChange={() => toggleTransaction(transaction.id)}
                                                    className="rounded border-gray-300 text-teal-500"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm text-gray-900 truncate">
                                                            {transaction.description}
                                                        </p>
                                                        <span className={`text-sm font-semibold ${transaction.transaction_type === 'deposit'
                                                            ? 'text-emerald-600'
                                                            : 'text-red-600'
                                                            }`}>
                                                            {transaction.transaction_type === 'deposit' ? '+' : '-'}
                                                            ${transaction.amount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(transaction.transaction_date).toLocaleDateString('es-ES')}
                                                        {transaction.reference && ` • Ref: ${transaction.reference}`}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Selecciona las transacciones que aparecen en el estado de cuenta del banco
                            </p>
                        </div>
                    )}

                    {/* Notas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            placeholder="Observaciones sobre la conciliación..."
                        />
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
                            disabled={loading || !selectedAccount}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            Conciliar ({selectedTransactions.length} transacciones)
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
