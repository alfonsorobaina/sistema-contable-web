import { useState } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { useCompany } from '../../context/CompanyContext';
import { ACCOUNT_TYPE_LABELS } from '../../types/accounting';
import type { Account, CreateAccountData, AccountType } from '../../types/accounting';
import {
    Plus,
    Download,
    Loader2,
    ChevronRight,
    ChevronDown,
    Edit2,
    Trash2,
    X,
    Check,
    AlertCircle
} from 'lucide-react';

export default function ChartOfAccounts() {
    const { activeCompany } = useCompany();
    const { accounts, loading, createAccount, updateAccount, deleteAccount, deleteAllAccounts, importBasicChartOfAccounts } = useAccounting();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [importLoading, setImportLoading] = useState(false);
    const [deleteAllLoading, setDeleteAllLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const isAdmin = activeCompany?.role === 'admin' || activeCompany?.role === 'accountant';

    // Organizar cuentas por jerarquía
    const getChildAccounts = (parentCode: string): Account[] => {
        return accounts.filter(acc => {
            if (!acc.code.startsWith(parentCode + '.')) return false;
            const remainingCode = acc.code.slice(parentCode.length + 1);
            return !remainingCode.includes('.');
        });
    };

    const topLevelAccounts = accounts.filter(acc => !acc.code.includes('.'));

    const toggleGroup = (code: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(code)) {
            newExpanded.delete(code);
        } else {
            newExpanded.add(code);
        }
        setExpandedGroups(newExpanded);
    };

    const handleImport = async () => {
        if (!confirm('¿Importar plan de cuentas básico? Esto creará las cuentas estándar.')) return;
        setImportLoading(true);
        setActionError(null);
        const result = await importBasicChartOfAccounts();
        if (!result.success) {
            setActionError(result.error || 'Error al importar');
        }
        setImportLoading(false);
    };

    const handleDelete = async (account: Account) => {
        if (!confirm(`¿Eliminar la cuenta "${account.name}"?`)) return;
        const result = await deleteAccount(account.id);
        if (!result.success) {
            setActionError(result.error || 'Error al eliminar');
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm(`¿ELIMINAR TODAS las ${accounts.length} cuentas? Esta acción no se puede deshacer.`)) return;
        if (!confirm('¿Estás SEGURO? Se borrarán TODAS las cuentas del plan contable.')) return;

        setDeleteAllLoading(true);
        setActionError(null);
        const result = await deleteAllAccounts();
        if (!result.success) {
            setActionError(result.error || 'Error al eliminar cuentas');
        }
        setDeleteAllLoading(false);
    };

    const renderAccount = (account: Account, depth: number = 0) => {
        const children = getChildAccounts(account.code);
        const hasChildren = children.length > 0 || account.is_parent;
        const isExpanded = expandedGroups.has(account.code);

        return (
            <div key={account.id}>
                <div
                    className={`
                        flex items-center gap-3 py-3 px-4 hover:bg-gray-50 transition-colors border-b border-gray-100
                        ${account.is_parent ? 'bg-gray-50/50 font-medium' : ''}
                    `}
                    style={{ paddingLeft: `${16 + depth * 24}px` }}
                >
                    {/* Expandir/Colapsar */}
                    <button
                        onClick={() => toggleGroup(account.code)}
                        className={`p-1 rounded hover:bg-gray-200 transition-colors ${!hasChildren ? 'invisible' : ''}`}
                    >
                        {isExpanded ? (
                            <ChevronDown size={16} className="text-gray-400" />
                        ) : (
                            <ChevronRight size={16} className="text-gray-400" />
                        )}
                    </button>

                    {/* Código */}
                    <span className="text-sm font-mono text-gray-500 w-20">{account.code}</span>

                    {/* Nombre */}
                    <span className={`flex-1 text-sm ${account.is_parent ? 'text-gray-800' : 'text-gray-700'}`}>
                        {account.name}
                    </span>

                    {/* Tipo */}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ACCOUNT_TYPE_LABELS[account.account_type].color}`}>
                        {ACCOUNT_TYPE_LABELS[account.account_type].label}
                    </span>

                    {/* Acciones */}
                    {isAdmin && !account.is_parent && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setEditingAccount(account)}
                                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Edit2 size={14} className="text-gray-400" />
                            </button>
                            <button
                                onClick={() => handleDelete(account)}
                                className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Hijos */}
                {isExpanded && children.map(child => renderAccount(child, depth + 1))}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-800">Plan de Cuentas</h3>
                    <p className="text-sm text-gray-500">{accounts.length} cuentas</p>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        {accounts.length === 0 && (
                            <button
                                onClick={handleImport}
                                disabled={importLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                {importLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                Importar Básico
                            </button>
                        )}
                        {accounts.length > 0 && (
                            <button
                                onClick={handleDeleteAll}
                                disabled={deleteAllLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                                {deleteAllLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Trash2 size={16} />
                                )}
                                Eliminar Todas
                            </button>
                        )}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all"
                        >
                            <Plus size={16} />
                            Nueva Cuenta
                        </button>
                    </div>
                )}
            </div>

            {/* Error */}
            {actionError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    <AlertCircle size={16} />
                    {actionError}
                    <button onClick={() => setActionError(null)} className="ml-auto">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Lista */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 size={24} className="mx-auto text-gray-400 animate-spin" />
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>No hay cuentas registradas</p>
                        <p className="text-sm mt-1">Importa el plan básico o crea cuentas manualmente</p>
                    </div>
                ) : (
                    topLevelAccounts.map(account => renderAccount(account))
                )}
            </div>

            {/* Modal Crear/Editar */}
            {(showCreateModal || editingAccount) && (
                <AccountFormModal
                    account={editingAccount}
                    accounts={accounts}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingAccount(null);
                    }}
                    onSave={async (data) => {
                        if (editingAccount) {
                            return await updateAccount(editingAccount.id, data);
                        } else {
                            return await createAccount(data);
                        }
                    }}
                />
            )}
        </div>
    );
}

// Modal para crear/editar cuenta
function AccountFormModal({
    account,
    accounts,
    onClose,
    onSave
}: {
    account: Account | null;
    accounts: Account[];
    onClose: () => void;
    onSave: (data: CreateAccountData) => Promise<{ success: boolean; error?: string }>;
}) {
    const [formData, setFormData] = useState<CreateAccountData>({
        code: account?.code || '',
        name: account?.name || '',
        account_type: account?.account_type || 'asset',
        parent_id: account?.parent_id || undefined,
        is_parent: account?.is_parent || false,
        description: account?.description || ''
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

    const parentAccounts = accounts.filter(a => a.is_parent);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {account ? 'Editar Cuenta' : 'Nueva Cuenta'}
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
                                placeholder="1.1.01"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                            <select
                                value={formData.account_type}
                                onChange={(e) => setFormData({ ...formData, account_type: e.target.value as AccountType })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                            >
                                {Object.entries(ACCOUNT_TYPE_LABELS).map(([type, { label }]) => (
                                    <option key={type} value={type}>{label}</option>
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
                            placeholder="Caja Chica"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Padre (opcional)</label>
                        <select
                            value={formData.parent_id || ''}
                            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || undefined })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                        >
                            <option value="">Sin padre</option>
                            {parentAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_parent"
                            checked={formData.is_parent}
                            onChange={(e) => setFormData({ ...formData, is_parent: e.target.checked })}
                            className="rounded border-gray-300 text-teal-500 focus:ring-teal-400"
                        />
                        <label htmlFor="is_parent" className="text-sm text-gray-700">Es cuenta padre (agrupadora)</label>
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
                            {account ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
