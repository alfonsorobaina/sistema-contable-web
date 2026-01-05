import { useCompany } from '../context/CompanyContext';
import {
    LayoutDashboard,
    TrendingUp,
    TrendingDown,
    DollarSign,
    FileText,
    Users,
    ArrowUpRight,
    Building2,
    Sparkles
} from 'lucide-react';

export default function Dashboard() {
    const { activeCompany, loading } = useCompany();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Si no hay empresa activa, mostrar bienvenida
    if (!activeCompany) {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                    <Sparkles size={40} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    ¡Bienvenido a YOT!
                </h1>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Para comenzar a usar el sistema, crea tu primera empresa haciendo clic en el botón del encabezado.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Building2 size={16} />
                    <span>Haz clic en "Crear Empresa" en la barra superior</span>
                </div>
            </div>
        );
    }

    // Dashboard con empresa activa
    const stats = [
        {
            label: 'Ingresos del Mes',
            value: `${activeCompany.currency_symbol} 0.00`,
            change: '+0%',
            trend: 'up',
            icon: TrendingUp,
            color: 'from-emerald-400 to-green-500'
        },
        {
            label: 'Gastos del Mes',
            value: `${activeCompany.currency_symbol} 0.00`,
            change: '0%',
            trend: 'down',
            icon: TrendingDown,
            color: 'from-rose-400 to-red-500'
        },
        {
            label: 'Balance',
            value: `${activeCompany.currency_symbol} 0.00`,
            change: '0%',
            trend: 'neutral',
            icon: DollarSign,
            color: 'from-teal-400 to-cyan-500'
        },
        {
            label: 'Facturas Pendientes',
            value: '0',
            change: '0 nuevas',
            trend: 'neutral',
            icon: FileText,
            color: 'from-amber-400 to-orange-500'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">{activeCompany.name}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm">
                    <span>Período:</span>
                    <span className="font-medium text-gray-800">Enero 2026</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                                    <Icon size={22} className="text-white" />
                                </div>
                                <span className={`
                  text-xs font-medium px-2 py-1 rounded-full
                  ${stat.trend === 'up' ? 'bg-emerald-100 text-emerald-600' : ''}
                  ${stat.trend === 'down' ? 'bg-rose-100 text-rose-600' : ''}
                  ${stat.trend === 'neutral' ? 'bg-gray-100 text-gray-600' : ''}
                `}>
                                    {stat.change}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Nueva Factura', icon: FileText, color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
                        { label: 'Registrar Gasto', icon: TrendingDown, color: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
                        { label: 'Ver Reportes', icon: LayoutDashboard, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
                        { label: 'Gestionar Usuarios', icon: Users, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
                    ].map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={index}
                                className={`
                  flex items-center gap-3 p-4 rounded-xl transition-colors
                  ${action.color}
                `}
                            >
                                <Icon size={20} />
                                <span className="font-medium text-sm">{action.label}</span>
                                <ArrowUpRight size={14} className="ml-auto opacity-50" />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Info de empresa */}
            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl shadow-teal-500/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-1">{activeCompany.name}</h3>
                        <p className="text-teal-100">RIF: {activeCompany.tax_id}</p>
                        {activeCompany.address && (
                            <p className="text-teal-100 text-sm mt-1">{activeCompany.address}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-teal-100 text-sm">Tu rol</p>
                            <p className="font-semibold capitalize">{activeCompany.role}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <Building2 size={24} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
