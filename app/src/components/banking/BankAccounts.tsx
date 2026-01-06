import { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { useAccounting } from '../../context/AccountingContext';
import { ACCOUNT_TYPES, CURRENCIES } from '../../types/banking';
import type { BankAccount, CreateBankAccountData } from '../../types/banking';
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
    DollarSign
} from 'lucide-react';

export default function BankAccounts() {
    const { bankAccounts, loading, createBankAccount, updateBankAccount, deleteBankAccount } = useBanking();
    const { accounts } = useAccounting();
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);

    const filteredAccounts = bankAccounts.filter(a =>
        a.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.account_number.includes(searchQuery)
    );

    const handleDelete = async (account: BankAccount) => {
        if (!confirm(`¿Eliminar cuenta bancaria "${account.bank_name} - ${account.account_number}"?`)) return;
        const result = await deleteBankAccount(account.id);
        if (!result.success) {
            setActionError(result.error || 'Error al eliminar');
        }
    };

    // Filtrar solo cuentas de activo (caja y bancos)
    const bankChartAccounts = accounts.filter(a => a.code.startsWith('1.1.'));

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Cuentas Bancarias</h3>
                    <p className="text-sm text-gray-500">{bankAccounts.length} registradas</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar cuenta..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none text-sm"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingAccount(null); setShowModal(true); }}
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div className="col-span-full p-8 text-center">
                        <Loader2 size={24} className="mx-auto text-gray-400 animate-spin" />
                    </div>
                ) : filteredAccounts.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-gray-500">
                        <Building2 size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>{searchQuery ? 'No se encontraron cuentas' : 'No hay cuentas registradas'}</p>
                    </div>
                ) : (
                    filteredAccounts.map(account => (
                        <div key={account.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-teal-100 rounded-lg">
                                        <Building2 size={18} className="text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{account.bank_name}</p>
                                        <p className="text-xs text-gray-500">{account.code}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => { setEditingAccount(account); setShowModal(true); }}
                                        className="p-1.5 rounded-lg hover:bg-gray-100"
                                    >
                                        <Edit2 size={14} className="text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(account)}
                                        className="p-1.5 rounded-lg hover:bg-red-100"
                                    >
                                        <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Número:</span>
                                    <span className="font-mono text-gray-700">{account.account_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tipo:</span>
                                    <span className="text-gray-700">
                                        {ACCOUNT_TYPES.find(t => t.value === account.account_type)?.label}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                    <span className="text-gray-500 flex items-center gap-1">
                                        <DollarSign size={14} />
                                        Balance:
                                    </span>
                                    <span className="font-semibold text-teal-600">
                                        {account.currency} {account.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <BankAccountFormModal
                    account={editingAccount}
                    chartAccounts={bankChartAccounts}
                    onClose={() => { setShowModal(false); setEditingAccount(null); }}
                    onSave={async (data) => {
                        if (editingAccount) {
                            return await updateBankAccount(editingAccount.id, data);
                        } else {
                            return await createBankAccount(data);
                        }
                    }}
                />
            )}
        </div>
    );
}

function BankAccountFormModal({
    account,
    chartAccounts,
    onClose,
    onSave
}: {
    account: BankAccount | null;
    chartAccounts: any[];
    onClose: () => void;
    onSave: (data: CreateBankAccountData) => Promise<{ success: boolean; error?: string }>;
}) {
    const [formData, setFormData] = useState<CreateBankAccountData>({
        code: account?.code || '',
        bank_name: account?.bank_name || '',
        account_number: account?.account_number || '',
        account_type: account?.account_type || 'checking',
        currency: account?.currency || 'USD',
        chart_account_id: account?.chart_account_id || '',
        initial_balance: account?.initial_balance || 0,
        notes: account?.notes || ''
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
                        {account ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
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
                                placeholder="BAN-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                            <select
                                value={formData.account_type}
                                onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            >
                                {ACCOUNT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Banco</label>
                        <input
                            type="text"
                            required
                            value={formData.bank_name}
                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            placeholder="Banco Nacional"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta</label>
                        <input
                            type="text"
                            required
                            value={formData.account_number}
                            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono"
                            placeholder="1234567890"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            >
                                {CURRENCIES.map(curr => (
                                    <option key={curr.value} value={curr.value}>{curr.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Balance Inicial</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.initial_balance}
                                onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Contable</label>
                        <select
                            value={formData.chart_account_id || ''}
                            onChange={(e) => setFormData({ ...formData, chart_account_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        >
                            <option value="">Seleccionar...</option>
                            {chartAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Vincula esta cuenta con el plan de cuentas</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
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
                            {account ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
