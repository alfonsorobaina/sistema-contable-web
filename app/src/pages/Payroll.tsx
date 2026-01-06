import { useState, useEffect } from 'react';
import { PayrollProvider, usePayroll } from '../context/PayrollContext';
import { useCompany } from '../context/CompanyContext';
import Employees from '../components/payroll/Employees';
import PayrollConcepts from '../components/payroll/PayrollConcepts';
import PayrollRuns from '../components/payroll/PayrollRuns';
import {
    Users,
    FileText,
    Settings,
    ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Tab = 'employees' | 'runs' | 'concepts';

function PayrollContent() {
    const { activeCompany } = useCompany();
    const { refreshEmployees, refreshConcepts, refreshPayrollRuns } = usePayroll();
    const [activeTab, setActiveTab] = useState<Tab>('employees');

    useEffect(() => {
        if (activeCompany) {
            refreshEmployees();
            refreshConcepts();
            refreshPayrollRuns();
        }
    }, [activeCompany, refreshEmployees, refreshConcepts, refreshPayrollRuns]);

    if (!activeCompany) return <div>Seleccione una empresa</div>;

    const tabs = [
        { id: 'employees' as Tab, label: 'Empleados', icon: Users },
        { id: 'runs' as Tab, label: 'Nóminas', icon: FileText },
        { id: 'concepts' as Tab, label: 'Conceptos de Ley', icon: Settings },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2">
                        <ArrowLeft size={16} /> Volver al Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Nómina (Venezuela)</h1>
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
                                        ? 'text-teal-600 border-teal-600 bg-teal-50/50'
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

                <div className="p-6">
                    {activeTab === 'employees' && <Employees />}
                    {activeTab === 'runs' && <PayrollRuns />}
                    {activeTab === 'concepts' && <PayrollConcepts />}
                </div>
            </div>
        </div>
    );
}

export default function Payroll() {
    return (
        <PayrollProvider>
            <PayrollContent />
        </PayrollProvider>
    );
}
