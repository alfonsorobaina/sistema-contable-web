import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompany, CompanyProvider } from '../context/CompanyContext';
import CompanySelector from '../components/CompanySelector';
import CreateCompanyModal from '../components/CreateCompanyModal';
import { LogOut, User, Menu, X, LayoutDashboard, FileText, Users, Settings, ChevronRight, Receipt, Wallet, Package, Building2, Database } from 'lucide-react';
import yotLogo from '../assets/yot-logo.png';

function LayoutContent() {
    const { user, signOut } = useAuth();
    const { activeCompany } = useCompany();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Contabilidad', href: '/accounting', icon: FileText },
        { name: 'Facturación', href: '/invoicing', icon: Receipt },
        { name: 'CxC / CxP', href: '/payables', icon: Wallet },
        { name: 'Inventario', href: '/inventory', icon: Package },
        { name: 'Bancos', href: '/banking', icon: Building2 },
        { name: 'Nómina', href: '/payroll', icon: Users },
        { name: 'Migración IA', href: '/migration', icon: Database },
        { name: 'Usuarios', href: '/users', icon: Users, disabled: true },
        { name: 'Configuración', href: '/company/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Navbar Premium */}
            <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 z-40">
                <div className="h-full px-4 flex items-center justify-between">
                    {/* Logo y Toggle */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        <div className="flex items-center gap-3">
                            <img src={yotLogo} alt="YOT" className="h-9 w-auto" />
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                    Sistema YOT
                                </h1>
                                <p className="text-xs text-gray-500 -mt-0.5">Administrativo</p>
                            </div>
                        </div>
                    </div>

                    {/* Centro - Company Selector */}
                    <div className="hidden md:flex items-center">
                        <CompanySelector onCreateClick={() => setShowCreateModal(true)} />
                    </div>

                    {/* Usuario */}
                    <div className="relative">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
                                {user?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="hidden sm:block text-sm text-gray-700 max-w-[120px] truncate">
                                {user?.email}
                            </span>
                        </button>

                        {userMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0"
                                    onClick={() => setUserMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
                                        <p className="text-xs text-gray-500">
                                            {activeCompany ? activeCompany.name : 'Sin empresa'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            // navigate to profile
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <User size={16} />
                                        Mi Perfil
                                    </button>
                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            signOut();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Sidebar */}
            <aside
                className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200/50
          transform transition-transform duration-300 z-30
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
            >
                {/* Mobile Company Selector */}
                <div className="p-4 md:hidden border-b border-gray-100">
                    <CompanySelector onCreateClick={() => setShowCreateModal(true)} />
                </div>

                {/* Navegación */}
                <nav className="p-4 space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = window.location.pathname === item.href;

                        return (
                            <a
                                key={item.name}
                                href={item.disabled ? '#' : item.href}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive
                                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25'
                                        : item.disabled
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }
                `}
                                onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.name}</span>
                                {item.disabled && (
                                    <span className="ml-auto text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                                        Próx.
                                    </span>
                                )}
                                {isActive && <ChevronRight size={16} className="ml-auto" />}
                            </a>
                        );
                    })}
                </nav>

                {/* Footer del sidebar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>© 2026 YOT</span>
                        <span>•</span>
                        <span>v1.0.0</span>
                    </div>
                </div>
            </aside>

            {/* Contenido principal */}
            <main
                className={`
          pt-16 min-h-screen transition-all duration-300
          ${sidebarOpen ? 'lg:pl-64' : ''}
        `}
            >
                <div className="p-6">
                    <Outlet />
                </div>
            </main>

            {/* Modal Crear Empresa */}
            <CreateCompanyModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    );
}

export default function Layout() {
    return (
        <CompanyProvider>
            <LayoutContent />
        </CompanyProvider>
    );
}
