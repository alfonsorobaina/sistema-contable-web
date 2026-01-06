import { useEffect, useState } from 'react';
import { usePayables, PayablesProvider } from '../context/PayablesContext';
import { useCompany } from '../context/CompanyContext';
import Suppliers from '../components/payables/Suppliers';
import AccountsPayable from '../components/payables/AccountsPayable';
import AccountsReceivable from '../components/payables/AccountsReceivable';
import {
    Wallet,
    Users,
    TrendingDown,
    TrendingUp,
    ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Tab = 'receivable' | 'payable' | 'suppliers';

function PayablesContent() {
    const { activeCompany } = useCompany();
    const { refreshSuppliers, refreshBills, refreshReceivables, refreshPayments } = usePayables();
    const [activeTab, setActiveTab] = useState<Tab>('receivable');

    useEffect(() => {
        if (activeCompany) {
            refreshSuppliers();
            refreshBills();
            refreshReceivables();
            refreshPayments();
        }
    }, [activeCompany, refreshSuppliers, refreshBills, refreshReceivables, refreshPayments]);

    if (!activeCompany) {
        return (
            <div className="text-center py-16">
                <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">No hay empresa seleccionada</h2>
                <p className="text-gray-500 mt-2">Selecciona una empresa para acceder a CxC/CxP</p>
            </div>
        );
    }

    const tabs = [
        { id: 'receivable' as Tab, label: 'Por Cobrar', icon: TrendingUp, color: 'text-emerald-600' },
        { id: 'payable' as Tab, label: 'Por Pagar', icon: TrendingDown, color: 'text-red-500' },
        { id: 'suppliers' as Tab, label: 'Proveedores', icon: Users, color: 'text-gray-600' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
                    >
                        <ArrowLeft size={16} />
                        Volver al Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Cuentas por Cobrar / Pagar</h1>
                    <p className="text-gray-500">{activeCompany.name}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium text-sm
                                    transition-all border-b-2
                                    ${activeTab === tab.id
                                        ? `${tab.color} border-current bg-gray-50/50`
                                        : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'receivable' && <AccountsReceivable />}
                    {activeTab === 'payable' && <AccountsPayable />}
                    {activeTab === 'suppliers' && <Suppliers />}
                </div>
            </div>
        </div>
    );
}

export default function Payables() {
    return (
        <PayablesProvider>
            <PayablesContent />
        </PayablesProvider>
    );
}
