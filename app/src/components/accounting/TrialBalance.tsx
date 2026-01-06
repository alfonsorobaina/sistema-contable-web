import { useState, useEffect } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { useCompany } from '../../context/CompanyContext';
import { ACCOUNT_TYPE_LABELS } from '../../types/accounting';
import { Loader2, BarChart3, Calendar } from 'lucide-react';

export default function TrialBalance() {
    const { activeCompany } = useCompany();
    const { balances, getBalances } = useAccounting();
    const [loading, setLoading] = useState(false);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const currencySymbol = activeCompany?.currency_symbol || 'Bs.';

    useEffect(() => {
        loadBalances();
    }, []);

    const loadBalances = async () => {
        setLoading(true);
        await getBalances(asOfDate);
        setLoading(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Math.abs(amount));
    };

    // Agrupar por tipo
    const groupedBalances = balances.reduce((acc, balance) => {
        if (!acc[balance.account_type]) {
            acc[balance.account_type] = [];
        }
        acc[balance.account_type].push(balance);
        return acc;
    }, {} as Record<string, typeof balances>);

    // Calcular totales
    const totalDebit = balances.reduce((sum, b) => sum + b.total_debit, 0);
    const totalCredit = balances.reduce((sum, b) => sum + b.total_credit, 0);

    // Totales por tipo
    const getTotals = (type: string) => {
        const items = groupedBalances[type] || [];
        return {
            debit: items.reduce((sum, b) => sum + b.total_debit, 0),
            credit: items.reduce((sum, b) => sum + b.total_credit, 0),
            balance: items.reduce((sum, b) => sum + b.balance, 0)
        };
    };

    const typeOrder = ['asset', 'liability', 'equity', 'income', 'expense'];

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-800">Balance de Comprobación</h3>
                    <p className="text-sm text-gray-500">Saldos de cuentas</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <input
                            type="date"
                            value={asOfDate}
                            onChange={(e) => setAsOfDate(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none text-sm"
                        />
                    </div>
                    <button
                        onClick={loadBalances}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Actualizar'}
                    </button>
                </div>
            </div>

            {/* Balance */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 size={24} className="mx-auto text-gray-400 animate-spin" />
                    </div>
                ) : balances.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>No hay movimientos registrados</p>
                        <p className="text-sm mt-1">Crea asientos contables para ver el balance</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Cuenta</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Débito</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Crédito</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {typeOrder.map(type => {
                                const items = groupedBalances[type] || [];
                                if (items.length === 0) return null;
                                const totals = getTotals(type);

                                return (
                                    <React.Fragment key={type}>
                                        {/* Header de grupo */}
                                        <tr className="bg-gray-100">
                                            <td colSpan={5} className="px-4 py-2">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACCOUNT_TYPE_LABELS[type as keyof typeof ACCOUNT_TYPE_LABELS].color}`}>
                                                    {ACCOUNT_TYPE_LABELS[type as keyof typeof ACCOUNT_TYPE_LABELS].label}
                                                </span>
                                            </td>
                                        </tr>
                                        {/* Cuentas */}
                                        {items.map(balance => (
                                            <tr key={balance.account_id} className="border-t border-gray-100 hover:bg-gray-50">
                                                <td className="px-4 py-2.5 font-mono text-gray-500">{balance.account_code}</td>
                                                <td className="px-4 py-2.5 text-gray-700">{balance.account_name}</td>
                                                <td className="px-4 py-2.5 text-right text-gray-900">
                                                    {balance.total_debit > 0 ? formatCurrency(balance.total_debit) : '-'}
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-gray-900">
                                                    {balance.total_credit > 0 ? formatCurrency(balance.total_credit) : '-'}
                                                </td>
                                                <td className={`px-4 py-2.5 text-right font-medium ${balance.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {currencySymbol} {formatCurrency(balance.balance)}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Subtotal */}
                                        <tr className="bg-gray-50 border-t border-gray-200">
                                            <td colSpan={2} className="px-4 py-2 text-right text-gray-600 font-medium">
                                                Subtotal {ACCOUNT_TYPE_LABELS[type as keyof typeof ACCOUNT_TYPE_LABELS].label}
                                            </td>
                                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(totals.debit)}</td>
                                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(totals.credit)}</td>
                                            <td className={`px-4 py-2 text-right font-medium ${totals.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {currencySymbol} {formatCurrency(totals.balance)}
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-800 text-white">
                                <td colSpan={2} className="px-4 py-3 font-semibold">TOTAL GENERAL</td>
                                <td className="px-4 py-3 text-right font-semibold">{currencySymbol} {formatCurrency(totalDebit)}</td>
                                <td className="px-4 py-3 text-right font-semibold">{currencySymbol} {formatCurrency(totalCredit)}</td>
                                <td className="px-4 py-3 text-right">
                                    {totalDebit === totalCredit ? (
                                        <span className="text-emerald-400">✓ Balanceado</span>
                                    ) : (
                                        <span className="text-red-400">✗ Diferencia: {currencySymbol} {formatCurrency(Math.abs(totalDebit - totalCredit))}</span>
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
}

// Need to import React for Fragment
import React from 'react';
