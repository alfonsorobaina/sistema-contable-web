import { useState, useEffect } from 'react';
import { usePayables } from '../../context/PayablesContext';
import { useCompany } from '../../context/CompanyContext';
import { formatRIF } from '../../types/invoicing';
import { BILL_STATUS_LABELS } from '../../types/payables';
import type { Bill, AgingReportRow, CreateBillData } from '../../types/payables';
import { PaymentModal } from './AccountsReceivable';
import {
    Plus,
    Loader2,
    DollarSign,
    X,
    Check,
    AlertCircle,
    FileText,
    BarChart3
} from 'lucide-react';

export default function AccountsPayable() {
    const { activeCompany } = useCompany();
    const { bills, suppliers, loadingBills, refreshBills, createBill, addBillLine, registerPayment, getAgingReport } = usePayables();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showNewBillModal, setShowNewBillModal] = useState(false);
    const [selectedBills, setSelectedBills] = useState<Bill[]>([]);
    const [agingReport, setAgingReport] = useState<AgingReportRow[]>([]);
    const [showAging, setShowAging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const currencySymbol = activeCompany?.currency_symbol || 'Bs.';

    // Filtrar solo facturas pendientes y parciales
    const pendingBills = bills.filter(b => b.status === 'pending' || b.status === 'partial');

    useEffect(() => {
        if (showAging) {
            loadAgingReport();
        }
    }, [showAging]);

    const loadAgingReport = async () => {
        setLoading(true);
        const data = await getAgingReport('payable');
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

    const totalPayable = pendingBills.reduce((sum, bill) => sum + bill.balance, 0);

    const toggleBill = (bill: Bill) => {
        if (selectedBills.find(b => b.id === bill.id)) {
            setSelectedBills(selectedBills.filter(b => b.id !== bill.id));
        } else {
            setSelectedBills([...selectedBills, bill]);
        }
    };

    const openPaymentModal = () => {
        if (selectedBills.length === 0) {
            setActionError('Selecciona al menos una factura para pagar');
            return;
        }
        setShowPaymentModal(true);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Cuentas por Pagar</h3>
                    <p className="text-sm text-gray-500">
                        Total pendiente: <span className="font-medium text-red-600">{currencySymbol} {formatCurrency(totalPayable)}</span>
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setShowAging(!showAging)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${showAging ? 'bg-gray-100 border-gray-300' : 'border-gray-200'}`}
                    >
                        <BarChart3 size={16} />
                        {showAging ? 'Ver Lista' : 'Antigüedad'}
                    </button>
                    <button
                        onClick={() => setShowNewBillModal(true)}
                        disabled={suppliers.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                        <Plus size={16} />
                        Nueva Factura
                    </button>
                    <button
                        onClick={openPaymentModal}
                        disabled={selectedBills.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-medium shadow-lg disabled:opacity-50"
                    >
                        <DollarSign size={16} />
                        Registrar Pago ({selectedBills.length})
                    </button>
                </div>
            </div>

            {suppliers.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                    Primero debes registrar proveedores en la pestaña "Proveedores".
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
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">Corriente</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">1-30</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">31-60</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">61-90</th>
                                    <th className="text-right px-4 py-3 font-medium text-red-600">+90</th>
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
                    {loadingBills ? (
                        <div className="p-8 text-center">
                            <Loader2 size={24} className="mx-auto text-gray-400 animate-spin" />
                        </div>
                    ) : pendingBills.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                            <p>No hay facturas pendientes de pago</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3"></th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Factura</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Fecha</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingBills.map(bill => {
                                    const supplier = bill.supplier as any;
                                    const statusInfo = BILL_STATUS_LABELS[bill.status];
                                    const isSelected = selectedBills.find(b => b.id === bill.id);
                                    return (
                                        <tr
                                            key={bill.id}
                                            className={`border-t border-gray-100 cursor-pointer transition-colors ${isSelected ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                                            onClick={() => toggleBill(bill)}
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={!!isSelected}
                                                    onChange={() => { }}
                                                    className="rounded border-gray-300 text-red-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-mono">{bill.bill_number}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium">{supplier?.name}</p>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                                                {formatDate(bill.bill_date)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(bill.total)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-red-600">
                                                {formatCurrency(bill.balance)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Modal Nueva Factura */}
            {showNewBillModal && (
                <NewBillModal
                    suppliers={suppliers}
                    currencySymbol={currencySymbol}
                    onClose={() => { setShowNewBillModal(false); refreshBills(); }}
                    onCreate={createBill}
                    onAddLine={addBillLine}
                />
            )}

            {/* Modal Pago */}
            {showPaymentModal && (
                <PaymentModal
                    type="expense"
                    documents={selectedBills.map(bill => ({
                        id: bill.id,
                        number: bill.bill_number,
                        entity: (bill.supplier as any)?.name || '',
                        total: bill.total,
                        balance: bill.balance
                    }))}
                    currencySymbol={currencySymbol}
                    onClose={() => { setShowPaymentModal(false); setSelectedBills([]); }}
                    onSubmit={async (data) => {
                        const result = await registerPayment({
                            payment_type: 'expense',
                            payment_date: data.payment_date,
                            payment_method: data.payment_method,
                            amount: data.amount,
                            reference: data.reference,
                            description: data.description,
                            allocations: data.allocations.map(a => ({
                                document_type: 'bill' as const,
                                document_id: a.document_id,
                                amount: a.amount
                            }))
                        });
                        if (result.success) {
                            await refreshBills();
                        }
                        return result;
                    }}
                />
            )}
        </div>
    );
}

// Modal Nueva Factura de Compra
function NewBillModal({
    suppliers,
    currencySymbol,
    onClose,
    onCreate,
    onAddLine
}: {
    suppliers: any[];
    currencySymbol: string;
    onClose: () => void;
    onCreate: (data: CreateBillData) => Promise<{ success: boolean; error?: string; id?: string }>;
    onAddLine: (data: any) => Promise<{ success: boolean; error?: string }>;
}) {
    const [step, setStep] = useState<'header' | 'lines'>('header');
    const [billId, setBillId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        supplier_id: '',
        bill_number: '',
        bill_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: ''
    });
    const [lines, setLines] = useState([
        { description: '', quantity: 1, unit_price: 0, tax_rate: 16 }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addLine = () => {
        setLines([...lines, { description: '', quantity: 1, unit_price: 0, tax_rate: 16 }]);
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
            setBillId(result.id);
            setStep('lines');
        } else {
            setError(result.error || 'Error al crear');
        }
        setLoading(false);
    };

    const handleSaveLines = async () => {
        if (!billId) return;

        const validLines = lines.filter(l => l.description && l.unit_price > 0);
        if (validLines.length === 0) {
            setError('Agrega al menos una línea');
            return;
        }

        setLoading(true);
        setError(null);

        for (const line of validLines) {
            const result = await onAddLine({
                bill_id: billId,
                description: line.description,
                quantity: line.quantity,
                unit_price: line.unit_price,
                tax_rate: line.tax_rate
            });
            if (!result.success) {
                setError(result.error || 'Error');
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
                        {step === 'header' ? 'Nueva Factura de Compra' : 'Agregar Líneas'}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                <select
                                    required
                                    value={formData.supplier_id}
                                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                                >
                                    <option value="">Seleccionar...</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{formatRIF(s.rif)} - {s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Factura</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.bill_number}
                                    onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })}
                                    placeholder="Número del proveedor"
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.bill_date}
                                        onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium disabled:opacity-50">
                                    {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Siguiente'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Líneas</label>
                                <button onClick={addLine} className="text-sm text-teal-600">+ Agregar</button>
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
                                                    className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                                    placeholder="Cant."
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={line.unit_price || ''}
                                                    onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                                    placeholder="Precio"
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={line.tax_rate}
                                                    onChange={(e) => updateLine(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                                                    className="w-16 px-2 py-2 rounded-lg border border-gray-200 text-sm text-center"
                                                    placeholder="IVA%"
                                                />
                                            </div>
                                        </div>
                                        <button onClick={() => removeLine(index)} disabled={lines.length <= 1} className="p-2 rounded-lg hover:bg-red-100 disabled:opacity-30">
                                            <X size={16} className="text-gray-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-100 rounded-xl p-4 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>{currencySymbol} {calcSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>IVA</span>
                                    <span>{currencySymbol} {calcTax().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                                    <span>Total</span>
                                    <span>{currencySymbol} {calcTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium">
                                    Cancelar
                                </button>
                                <button onClick={handleSaveLines} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                    Guardar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
