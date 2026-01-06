import { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { useAccounting } from '../../context/AccountingContext';
import { TRANSACTION_TYPE_LABELS, TRANSACTION_STATUS_LABELS } from '../../types/banking';
import type { BankTransaction, CreateBankTransactionData, TransactionType } from '../../types/banking';
import {
    Plus,
    Search,
    Loader2,
    X,
    Check,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    ArrowLeftRight,
    Calendar
} from 'lucide-react';

export default function BankTransactions() {
    const { bankAccounts, bankTransactions, loading, registerTransaction, refreshBankTransactions } = useBanking();
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reconciled'>('all');
    const [actionError, setActionError] = useState<string | null>(null);

    const filteredTransactions = bankTransactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.reference && t.reference.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Transacciones Bancarias</h3>
                    <p className="text-sm text-gray-500">{bankTransactions.length} registradas</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar transacción..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none text-sm"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
                    >
                        <option value="all">Todos</option>
                        <option value="pending">Pendientes</option>
                        <option value="reconciled">Conciliados</option>
                    </select>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-teal-500/25"
                    >
                        <Plus size={16} />
                        Nueva
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
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <TrendingUp size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>{searchQuery ? 'No se encontraron transacciones' : 'No hay transacciones registradas'}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Cuenta</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Descripción</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Monto</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(transaction => {
                                const typeInfo = TRANSACTION_TYPE_LABELS[transaction.transaction_type];
                                const statusInfo = TRANSACTION_STATUS_LABELS[transaction.status];

                                return (
                                    <tr key={transaction.id} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-600">
                                            {new Date(transaction.transaction_date).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${typeInfo.color}`}>
                                                {typeInfo.icon} {typeInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-gray-900 font-medium">
                                                {(transaction.bank_account as any)?.bank_name || 'N/A'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {(transaction.bank_account as any)?.code}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-gray-900">{transaction.description}</p>
                                            {transaction.reference && (
                                                <p className="text-xs text-gray-500">Ref: {transaction.reference}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-semibold ${transaction.transaction_type === 'deposit'
                                                    ? 'text-emerald-600'
                                                    : 'text-red-600'
                                                }`}>
                                                {transaction.transaction_type === 'deposit' ? '+' : '-'}
                                                ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <TransactionFormModal
                    bankAccounts={bankAccounts}
                    onClose={() => setShowModal(false)}
                    onSave={async (data) => {
                        const result = await registerTransaction(data);
                        if (result.success) {
                            await refreshBankTransactions();
                        }
                        return result;
                    }}
                />
            )}
        </div>
    );
}

function TransactionFormModal({
    bankAccounts,
    onClose,
    onSave
}: {
    bankAccounts: any[];
    onClose: () => void;
    onSave: (data: CreateBankTransactionData) => Promise<{ success: boolean; error?: string }>;
}) {
    const { chartOfAccounts } = useAccounting();
    const [transactionType, setTransactionType] = useState<TransactionType>('deposit');
    const [formData, setFormData] = useState<CreateBankTransactionData>({
        bank_account_id: '',
        transaction_type: 'deposit',
        amount: 0,
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        destination_account_id: '',
        counterpart_account_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await onSave({ ...formData, transaction_type: transactionType });

        if (result.success) {
            onClose();
        } else {
            setError(result.error || 'Error al guardar');
        }
        setLoading(false);
    };

    // Filtrar cuentas según el tipo de transacción
    const getCounterpartAccounts = () => {
        if (transactionType === 'deposit') {
            // Para depósitos: cuentas de ingreso (4.x) o cuentas por cobrar (1.2.x)
            return chartOfAccounts.filter(a => a.code.startsWith('4.') || a.code.startsWith('1.2.'));
        } else if (transactionType === 'withdrawal') {
            // Para retiros: cuentas de gasto (5.x) o cuentas por pagar (2.1.x)
            return chartOfAccounts.filter(a => a.code.startsWith('5.') || a.code.startsWith('2.1.'));
        }
        return [];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Nueva Transacción Bancaria</h2>
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

                    {/* Selector de Tipo de Transacción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Transacción</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setTransactionType('deposit')}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${transactionType === 'deposit'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <TrendingDown size={20} />
                                <span className="text-xs font-medium">Depósito</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTransactionType('withdrawal')}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${transactionType === 'withdrawal'
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <TrendingUp size={20} />
                                <span className="text-xs font-medium">Retiro</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTransactionType('transfer')}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${transactionType === 'transfer'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <ArrowLeftRight size={20} />
                                <span className="text-xs font-medium">Transfer.</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {transactionType === 'transfer' ? 'Cuenta Origen' : 'Cuenta Bancaria'}
                        </label>
                        <select
                            required
                            value={formData.bank_account_id}
                            onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
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

                    {transactionType === 'transfer' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Destino</label>
                            <select
                                required
                                value={formData.destination_account_id}
                                onChange={(e) => setFormData({ ...formData, destination_account_id: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            >
                                <option value="">Seleccionar...</option>
                                {bankAccounts.filter(a => a.id !== formData.bank_account_id).map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.bank_name} - {acc.account_number}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {transactionType !== 'transfer' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cuenta Contable {transactionType === 'deposit' ? '(Ingreso/Cobro)' : '(Gasto/Pago)'}
                            </label>
                            <select
                                value={formData.counterpart_account_id}
                                onChange={(e) => setFormData({ ...formData, counterpart_account_id: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            >
                                <option value="">Seleccionar...</option>
                                {getCounterpartAccounts().map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {acc.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Opcional: Para crear asiento contable completo</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                min="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                            <input
                                type="date"
                                required
                                value={formData.transaction_date}
                                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
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
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            placeholder="Concepto de la transacción"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                        <input
                            type="text"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            placeholder="Número de cheque, transferencia, etc."
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
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            Registrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
