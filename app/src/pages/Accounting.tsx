import { useEffect, useState } from 'react';
import { useAccounting, AccountingProvider } from '../context/AccountingContext';
import { useCompany } from '../context/CompanyContext';
import ChartOfAccounts from '../components/accounting/ChartOfAccounts';
import JournalEntries from '../components/accounting/JournalEntries';
import TrialBalance from '../components/accounting/TrialBalance';
import {
    BookOpen,
    FileText,
    BarChart3,
    Calculator,
    ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Tab = 'accounts' | 'entries' | 'balance';

function AccountingContent() {
    const { activeCompany } = useCompany();
    const { refreshAccounts, refreshJournalEntries } = useAccounting();
    const [activeTab, setActiveTab] = useState<Tab>('accounts');

    useEffect(() => {
        if (activeCompany) {
            refreshAccounts();
            refreshJournalEntries();
        }
    }, [activeCompany, refreshAccounts, refreshJournalEntries]);

    if (!activeCompany) {
        return (
            <div className="text-center py-16">
                <Calculator size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">No hay empresa seleccionada</h2>
                <p className="text-gray-500 mt-2">Selecciona una empresa para acceder a la contabilidad</p>
            </div>
        );
    }

    const tabs = [
        { id: 'accounts' as Tab, label: 'Plan de Cuentas', icon: BookOpen },
        { id: 'entries' as Tab, label: 'Asientos', icon: FileText },
        { id: 'balance' as Tab, label: 'Balance', icon: BarChart3 },
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
                    <h1 className="text-2xl font-bold text-gray-900">Contabilidad</h1>
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
                                        ? 'text-teal-600 border-teal-500 bg-teal-50/50'
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
                    {activeTab === 'accounts' && <ChartOfAccounts />}
                    {activeTab === 'entries' && <JournalEntries />}
                    {activeTab === 'balance' && <TrialBalance />}
                </div>
            </div>
        </div>
    );
}

export default function Accounting() {
    return (
        <AccountingProvider>
            <AccountingContent />
        </AccountingProvider>
    );
}
