import { useState, useEffect } from 'react';
import { usePayables } from '../../context/PayablesContext';
import { useCompany } from '../../context/CompanyContext';
import { formatRIF } from '../../types/invoicing';
import { PAYMENT_METHOD_LABELS } from '../../types/payables';
import type { Invoice } from '../../types/invoicing';
import type { PaymentMethod, AgingReportRow } from '../../types/payables';
import {
    Loader2,
    DollarSign,
    X,
    Check,
    AlertCircle,
    FileText,
    BarChart3
} from 'lucide-react';

export default function AccountsReceivable() {
    const { activeCompany } = useCompany();
    const { receivables, refreshReceivables, registerPayment, getAgingReport } = usePayables();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
    const [agingReport, setAgingReport] = useState<AgingReportRow[]>([]);
    const [showAging, setShowAging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const currencySymbol = activeCompany?.currency_symbol || 'Bs.';

    useEffect(() => {
        if (showAging) {
            loadAgingReport();
        }
    }, [showAging]);

    const loadAgingReport = async () => {
        setLoading(true);
        const data = await getAgingReport('receivable');
        setAgingReport(data);
        setLoading(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-VE', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const totalReceivable = receivables.reduce((sum, inv) => sum + (inv.total - (inv.amount_paid || 0)), 0);

    const toggleInvoice = (invoice: Invoice) => {
        if (selectedInvoices.find(i => i.id === invoice.id)) {
            setSelectedInvoices(selectedInvoices.filter(i => i.id !== invoice.id));
        } else {
            setSelectedInvoices([...selectedInvoices, invoice]);
        }
    };

    const openPaymentModal = () => {
        if (selectedInvoices.length === 0) {
            setActionError('Selecciona al menos una factura para cobrar');
            return;
        }
        setShowPaymentModal(true);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Cuentas por Cobrar</h3>
                    <p className="text-sm text-gray-500">
                        Total pendiente: <span className="font-medium text-emerald-600">{currencySymbol} {formatCurrency(totalReceivable)}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAging(!showAging)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${showAging ? 'bg-gray-100 border-gray-300' : 'border-gray-200'}`}
                    >
                        <BarChart3 size={16} />
                        {showAging ? 'Ver Lista' : 'Antigüedad'}
                    </button>
                    <button
                        onClick={openPaymentModal}
                        disabled={selectedInvoices.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium shadow-lg disabled:opacity-50"
                    >
                        <DollarSign size={16} />
                        Registrar Cobro ({selectedInvoices.length})
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

            {showAging ? (
                /* Reporte de Antigüedad */
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 size={24} className="mx-auto text-gray-400 animate-spin" />
                        </div>
                    ) : agingReport.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No hay saldos pendientes
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">Corriente</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">1-30</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">31-60</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">61-90</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600 text-red-600">+90</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agingReport.map(row => (
                                    <tr key={row.entity_id} className="border-t border-gray-100">
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{row.entity_name}</p>
                                            <p className="text-xs text-gray-500">{formatRIF(row.entity_rif)}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(row.current_amount)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(row.days_1_30)}</td>
                                        <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(row.days_31_60)}</td>
                                        <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(row.days_61_90)}</td>
                                        <td className="px-4 py-3 text-right text-red-600 font-medium">{formatCurrency(row.days_over_90)}</td>
                                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(row.total_balance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                /* Lista de Facturas */
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {receivables.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                            <p>No hay facturas pendientes de cobro</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3"></th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Factura</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Fecha</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receivables.map(invoice => {
                                    const customer = invoice.customer as any;
                                    const balance = invoice.total - (invoice.amount_paid || 0);
                                    const isSelected = selectedInvoices.find(i => i.id === invoice.id);
                                    return (
                                        <tr
                                            key={invoice.id}
                                            className={`border-t border-gray-100 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                                            onClick={() => toggleInvoice(invoice)}
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={!!isSelected}
                                                    onChange={() => { }}
                                                    className="rounded border-gray-300 text-emerald-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-mono">{invoice.invoice_number}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium">{customer?.name}</p>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                                                {formatDate(invoice.invoice_date)}
                                            </td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(invoice.total)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-emerald-600">
                                                {formatCurrency(balance)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Modal Pago */}
            {showPaymentModal && (
                <PaymentModal
                    type="income"
                    documents={selectedInvoices.map(inv => ({
                        id: inv.id,
                        number: inv.invoice_number || '',
                        entity: (inv.customer as any)?.name || '',
                        total: inv.total,
                        balance: inv.total - (inv.amount_paid || 0)
                    }))}
                    currencySymbol={currencySymbol}
                    onClose={() => { setShowPaymentModal(false); setSelectedInvoices([]); }}
                    onSubmit={async (data) => {
                        const result = await registerPayment({
                            payment_type: 'income',
                            payment_date: data.payment_date,
                            payment_method: data.payment_method,
                            amount: data.amount,
                            reference: data.reference,
                            description: data.description,
                            allocations: data.allocations.map(a => ({
                                document_type: 'invoice' as const,
                                document_id: a.document_id,
                                amount: a.amount
                            }))
                        });
                        if (result.success) {
                            await refreshReceivables();
                        }
                        return result;
                    }}
                />
            )}
        </div>
    );
}

// Modal de Pago/Cobro reutilizable
export function PaymentModal({
    type,
    documents,
    currencySymbol,
    onClose,
    onSubmit
}: {
    type: 'income' | 'expense';
    documents: { id: string; number: string; entity: string; total: number; balance: number }[];
    currencySymbol: string;
    onClose: () => void;
    onSubmit: (data: {
        payment_date: string;
        payment_method: PaymentMethod;
        amount: number;
        reference?: string;
        description?: string;
        allocations: { document_id: string; amount: number }[];
    }) => Promise<{ success: boolean; error?: string }>;
}) {
    const [formData, setFormData] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'transfer' as PaymentMethod,
        reference: '',
        description: ''
    });
    const [allocations, setAllocations] = useState(
        documents.map(d => ({ document_id: d.id, amount: d.balance }))
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0);

    const updateAllocation = (docId: string, amount: number) => {
        setAllocations(allocations.map(a =>
            a.document_id === docId ? { ...a, amount } : a
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (totalAmount <= 0) {
            setError('El monto debe ser mayor a cero');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await onSubmit({
            ...formData,
            amount: totalAmount,
            allocations: allocations.filter(a => a.amount > 0)
        });

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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {type === 'income' ? 'Registrar Cobro' : 'Registrar Pago'}
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

                    {/* Documentos */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Aplicar a:</label>
                        {documents.map((doc, idx) => (
                            <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{doc.number}</p>
                                    <p className="text-xs text-gray-500">{doc.entity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Saldo: {currencySymbol} {doc.balance.toFixed(2)}</p>
                                    <input
                                        type="number"
                                        min="0"
                                        max={doc.balance}
                                        step="0.01"
                                        value={allocations[idx].amount}
                                        onChange={(e) => updateAllocation(doc.id, parseFloat(e.target.value) || 0)}
                                        className="w-28 px-2 py-1 text-right rounded border border-gray-200 text-sm"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Datos del pago */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                            <input
                                type="date"
                                required
                                value={formData.payment_date}
                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                            <select
                                value={formData.payment_method}
                                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                            >
                                {Object.entries(PAYMENT_METHOD_LABELS).map(([method, label]) => (
                                    <option key={method} value={method}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                        <input
                            type="text"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="Número de transferencia, cheque, etc."
                            className="w-full px-3 py-2 rounded-xl border border-gray-200"
                        />
                    </div>

                    {/* Total */}
                    <div className="bg-gray-100 rounded-xl p-4 flex justify-between items-center">
                        <span className="font-medium">Total a {type === 'income' ? 'cobrar' : 'pagar'}</span>
                        <span className="text-xl font-bold">{currencySymbol} {totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || totalAmount <= 0}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${type === 'income'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                : 'bg-gradient-to-r from-red-500 to-rose-500'
                                }`}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            {type === 'income' ? 'Registrar Cobro' : 'Registrar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
