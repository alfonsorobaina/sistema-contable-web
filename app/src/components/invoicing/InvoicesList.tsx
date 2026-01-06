import { useState } from 'react';
import { useInvoicing } from '../../context/InvoicingContext';
import { INVOICE_STATUS_LABELS, formatRIF } from '../../types/invoicing';
import type { Invoice, InvoiceStatus } from '../../types/invoicing';
import {
    Plus,
    Search,
    Loader2,
    Eye,
    Send,
    XCircle,
    FileText,
    AlertCircle,
    X,
    Check
} from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';

export default function InvoicesList() {
    const { activeCompany } = useCompany();
    const { invoices, customers, taxProfiles, loadingInvoices, createInvoice, issueInvoice, createCreditNote, refreshInvoices, getInvoice, addInvoiceLine } = useInvoicing();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
    const [showNewModal, setShowNewModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState<Invoice | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const currencySymbol = activeCompany?.currency_symbol || 'Bs.';

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = !searchQuery ||
            (inv.customer as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-VE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleIssue = async (invoice: Invoice) => {
        if (!confirm(`¿Emitir factura? Esta acción generará el número fiscal y no podrá modificarse después.`)) return;
        if (!confirm(`CONFIRMACIÓN FINAL: ¿Estás seguro de emitir esta factura por ${currencySymbol} ${formatCurrency(invoice.total)}?`)) return;

        setActionLoading(invoice.id);
        setActionError(null);
        const result = await issueInvoice(invoice.id);
        if (!result.success) {
            setActionError(result.error || 'Error al emitir');
        }
        setActionLoading(null);
    };

    const handleCancel = async (invoice: Invoice) => {
        const reason = prompt('Motivo de anulación (Nota de Crédito):');
        if (!reason) return;

        setActionLoading(invoice.id);
        setActionError(null);
        const result = await createCreditNote(invoice.id, reason);
        if (!result.success) {
            setActionError(result.error || 'Error al anular');
        }
        setActionLoading(null);
    };

    const handleViewDetail = async (invoice: Invoice) => {
        const full = await getInvoice(invoice.id);
        if (full) {
            setShowDetailModal(full);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Facturas</h3>
                    <p className="text-sm text-gray-500">{invoices.length} registradas</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto flex-wrap">
                    <div className="relative flex-1 sm:w-48">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                        className="px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 outline-none text-sm"
                    >
                        <option value="all">Todos</option>
                        {Object.entries(INVOICE_STATUS_LABELS).map(([status, { label }]) => (
                            <option key={status} value={status}>{label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowNewModal(true)}
                        disabled={customers.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-teal-500/25 disabled:opacity-50"
                    >
                        <Plus size={16} />
                        Nueva
                    </button>
                </div>
            </div>

            {customers.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                    Primero debes registrar clientes en la pestaña "Clientes" para crear facturas.
                </div>
            )}

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
                {loadingInvoices ? (
                    <div className="p-8 text-center">
                        <Loader2 size={24} className="mx-auto text-gray-400 animate-spin" />
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>{searchQuery || statusFilter !== 'all' ? 'No se encontraron facturas' : 'No hay facturas registradas'}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Fecha</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(invoice => {
                                const statusInfo = INVOICE_STATUS_LABELS[invoice.status];
                                const customer = invoice.customer as any;
                                return (
                                    <tr key={invoice.id} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <p className="font-mono font-medium text-gray-900">
                                                {invoice.invoice_number || 'Borrador'}
                                            </p>
                                            {invoice.control_number && (
                                                <p className="text-xs text-gray-500">Ctrl: {invoice.control_number}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{customer?.name || '-'}</p>
                                            <p className="text-xs text-gray-500">{customer?.rif ? formatRIF(customer.rif) : ''}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                                            {formatDate(invoice.invoice_date)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                                            {currencySymbol} {formatCurrency(invoice.total)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 justify-end">
                                                {actionLoading === invoice.id ? (
                                                    <Loader2 size={16} className="animate-spin text-gray-400" />
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleViewDetail(invoice)}
                                                            className="p-1.5 rounded-lg hover:bg-gray-200"
                                                            title="Ver detalle"
                                                        >
                                                            <Eye size={14} className="text-gray-400" />
                                                        </button>
                                                        {invoice.status === 'draft' && (
                                                            <button
                                                                onClick={() => handleIssue(invoice)}
                                                                className="p-1.5 rounded-lg hover:bg-teal-100"
                                                                title="Emitir factura"
                                                            >
                                                                <Send size={14} className="text-teal-600" />
                                                            </button>
                                                        )}
                                                        {invoice.status === 'issued' && (
                                                            <button
                                                                onClick={() => handleCancel(invoice)}
                                                                className="p-1.5 rounded-lg hover:bg-red-100"
                                                                title="Anular con Nota de Crédito"
                                                            >
                                                                <XCircle size={14} className="text-red-500" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Nueva Factura */}
            {showNewModal && (
                <NewInvoiceModal
                    customers={customers}
                    taxProfiles={taxProfiles}
                    currencySymbol={currencySymbol}
                    onClose={() => { setShowNewModal(false); refreshInvoices(); }}
                    onCreate={createInvoice}
                    onAddLine={addInvoiceLine}
                />
            )}

            {/* Modal Detalle */}
            {showDetailModal && (
                <InvoiceDetailModal
                    invoice={showDetailModal}
                    currencySymbol={currencySymbol}
                    onClose={() => setShowDetailModal(null)}
                />
            )}
        </div>
    );
}

// Modal Nueva Factura
function NewInvoiceModal({
    customers,
    taxProfiles,
    currencySymbol,
    onClose,
    onCreate,
    onAddLine
}: {
    customers: any[];
    taxProfiles: any[];
    currencySymbol: string;
    onClose: () => void;
    onCreate: (data: any) => Promise<{ success: boolean; error?: string; id?: string }>;
    onAddLine: (data: any) => Promise<{ success: boolean; error?: string }>;
}) {
    const [step, setStep] = useState<'header' | 'lines'>('header');
    const [invoiceId, setInvoiceId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        customer_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: ''
    });
    const [lines, setLines] = useState<{ description: string; quantity: number; unit_price: number; tax_rate: number }[]>([
        { description: '', quantity: 1, unit_price: 0, tax_rate: taxProfiles.find(t => t.is_default)?.rate || 16 }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const defaultTaxRate = taxProfiles.find(t => t.is_default)?.rate || 16;

    const addLine = () => {
        setLines([...lines, { description: '', quantity: 1, unit_price: 0, tax_rate: defaultTaxRate }]);
    };

    const removeLine = (index: number) => {
        if (lines.length <= 1) return;
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: string, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const calcSubtotal = () => lines.reduce((sum, l) => sum + (l.quantity * l.unit_price), 0);
    const calcTax = () => lines.reduce((sum, l) => sum + (l.quantity * l.unit_price * l.tax_rate / 100), 0);
    const calcTotal = () => calcSubtotal() + calcTax();

    const handleCreateHeader = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await onCreate(formData);

        if (result.success && result.id) {
            setInvoiceId(result.id);
            setStep('lines');
        } else {
            setError(result.error || 'Error al crear factura');
        }
        setLoading(false);
    };

    const handleSaveLines = async () => {
        if (!invoiceId) return;

        const validLines = lines.filter(l => l.description && l.unit_price > 0);
        if (validLines.length === 0) {
            setError('Agrega al menos una línea con descripción y precio');
            return;
        }

        setLoading(true);
        setError(null);

        for (const line of validLines) {
            const result = await onAddLine({
                invoice_id: invoiceId,
                description: line.description,
                quantity: line.quantity,
                unit_price: line.unit_price,
                tax_rate: line.tax_rate
            });
            if (!result.success) {
                setError(result.error || 'Error al agregar línea');
                setLoading(false);
                return;
            }
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {step === 'header' ? 'Nueva Factura' : 'Agregar Líneas'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {step === 'header' ? (
                        <form onSubmit={handleCreateHeader} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                <select
                                    required
                                    value={formData.customer_id}
                                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                                >
                                    <option value="">Seleccionar cliente...</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{formatRIF(c.rif)} - {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Factura</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.invoice_date}
                                        onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Vencimiento</label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none resize-none"
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
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg shadow-teal-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                                    Siguiente
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Productos/Servicios</label>
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
                                    <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Descripción"
                                                value={line.description}
                                                onChange={(e) => updateLine(index, 'description', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 1)}
                                                    className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-sm text-center"
                                                    placeholder="Cant."
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={line.unit_price || ''}
                                                    onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                                    placeholder="Precio unitario"
                                                />
                                                <select
                                                    value={line.tax_rate}
                                                    onChange={(e) => updateLine(index, 'tax_rate', parseFloat(e.target.value))}
                                                    className="w-24 px-2 py-2 rounded-lg border border-gray-200 text-sm"
                                                >
                                                    {taxProfiles.map(t => (
                                                        <option key={t.id} value={t.rate}>{t.rate}%</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeLine(index)}
                                            disabled={lines.length <= 1}
                                            className="p-2 rounded-lg hover:bg-red-100 disabled:opacity-30"
                                        >
                                            <X size={16} className="text-gray-400 hover:text-red-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Totales */}
                            <div className="bg-gray-100 rounded-xl p-4 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span>{currencySymbol} {calcSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">IVA</span>
                                    <span>{currencySymbol} {calcTax().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                                    <span>Total</span>
                                    <span>{currencySymbol} {calcTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Guardar Borrador
                                </button>
                                <button
                                    onClick={handleSaveLines}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg shadow-teal-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                    Crear Factura
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Modal Detalle Factura
function InvoiceDetailModal({
    invoice,
    currencySymbol,
    onClose
}: {
    invoice: Invoice;
    currencySymbol: string;
    onClose: () => void;
}) {
    const statusInfo = INVOICE_STATUS_LABELS[invoice.status];
    const customer = invoice.customer as any;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {invoice.invoice_number || 'Factura Borrador'}
                        </h2>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Cliente</p>
                            <p className="font-medium">{customer?.name}</p>
                            <p className="text-sm text-gray-500">{customer?.rif ? formatRIF(customer.rif) : ''}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Control</p>
                            <p className="font-mono">{invoice.control_number || '-'}</p>
                        </div>
                    </div>

                    {/* Líneas */}
                    {invoice.lines && invoice.lines.length > 0 && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-4 py-2 font-medium text-gray-600">Descripción</th>
                                        <th className="text-center px-4 py-2 font-medium text-gray-600">Cant.</th>
                                        <th className="text-right px-4 py-2 font-medium text-gray-600">Precio</th>
                                        <th className="text-right px-4 py-2 font-medium text-gray-600">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.lines.map(line => (
                                        <tr key={line.id} className="border-t border-gray-100">
                                            <td className="px-4 py-2">{line.description}</td>
                                            <td className="px-4 py-2 text-center">{line.quantity}</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(line.unit_price)}</td>
                                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(line.line_total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Totales */}
                    <div className="bg-gray-100 rounded-xl p-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Subtotal</span>
                            <span>{currencySymbol} {formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">IVA</span>
                            <span>{currencySymbol} {formatCurrency(invoice.tax_amount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl pt-2 border-t border-gray-200">
                            <span>TOTAL</span>
                            <span>{currencySymbol} {formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
