import { useEffect, useState } from 'react';
import { useInvoicing, InvoicingProvider } from '../context/InvoicingContext';
import { useCompany } from '../context/CompanyContext';
import Customers from '../components/invoicing/Customers';
import InvoicesList from '../components/invoicing/InvoicesList';
import TaxProfiles from '../components/invoicing/TaxProfiles';
import {
    FileText,
    Users,
    Percent,
    Calculator,
    ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Tab = 'invoices' | 'customers' | 'taxes';

function InvoicingContent() {
    const { activeCompany } = useCompany();
    const { refreshCustomers, refreshTaxProfiles, refreshInvoices } = useInvoicing();
    const [activeTab, setActiveTab] = useState<Tab>('invoices');

    useEffect(() => {
        if (activeCompany) {
            refreshCustomers();
            refreshTaxProfiles();
            refreshInvoices();
        }
    }, [activeCompany, refreshCustomers, refreshTaxProfiles, refreshInvoices]);

    if (!activeCompany) {
        return (
            <div className="text-center py-16">
                <Calculator size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">No hay empresa seleccionada</h2>
                <p className="text-gray-500 mt-2">Selecciona una empresa para acceder a facturación</p>
            </div>
        );
    }

    const tabs = [
        { id: 'invoices' as Tab, label: 'Facturas', icon: FileText },
        { id: 'customers' as Tab, label: 'Clientes', icon: Users },
        { id: 'taxes' as Tab, label: 'Impuestos', icon: Percent },
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
                    <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
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
                    {activeTab === 'invoices' && <InvoicesList />}
                    {activeTab === 'customers' && <Customers />}
                    {activeTab === 'taxes' && <TaxProfiles />}
                </div>
            </div>
        </div>
    );
}

export default function Invoicing() {
    return (
        <InvoicingProvider>
            <InvoicingContent />
        </InvoicingProvider>
    );
}
