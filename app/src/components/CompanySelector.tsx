import { useState, useRef, useEffect } from 'react';
import { useCompany } from '../context/CompanyContext';
import { Building2, ChevronDown, Plus, Check, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CompanySelectorProps {
    onCreateClick: () => void;
}

export default function CompanySelector({ onCreateClick }: CompanySelectorProps) {
    const { companies, activeCompany, setActiveCompany, loading } = useCompany();
    const [isOpen, setIsOpen] = useState(false);
    const [switching, setSwitching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectCompany = async (companyId: string) => {
        if (companyId === activeCompany?.id) {
            setIsOpen(false);
            return;
        }

        setSwitching(true);
        await setActiveCompany(companyId);
        setSwitching(false);
        setIsOpen(false);
    };

    // Obtener iniciales del nombre
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Color basado en nombre (consistente)
    const getColorClass = (name: string) => {
        const colors = [
            'bg-gradient-to-br from-teal-400 to-cyan-500',
            'bg-gradient-to-br from-violet-400 to-purple-500',
            'bg-gradient-to-br from-amber-400 to-orange-500',
            'bg-gradient-to-br from-emerald-400 to-green-500',
            'bg-gradient-to-br from-rose-400 to-pink-500',
            'bg-gradient-to-br from-sky-400 to-blue-500',
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
                <div className="w-24 h-4 rounded bg-gray-200"></div>
            </div>
        );
    }

    if (companies.length === 0) {
        return (
            <button
                onClick={onCreateClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-300 hover:scale-105"
            >
                <Plus size={18} />
                <span>Crear Empresa</span>
            </button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Botón principal */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={switching}
                className={`
          flex items-center gap-3 px-3 py-2 rounded-xl 
          bg-white border border-gray-200 
          hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/10
          transition-all duration-300 min-w-[200px]
          ${isOpen ? 'border-teal-400 shadow-lg shadow-teal-500/10' : ''}
          ${switching ? 'opacity-70' : ''}
        `}
            >
                {activeCompany ? (
                    <>
                        <div className={`w-8 h-8 rounded-lg ${getColorClass(activeCompany.name)} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                            {getInitials(activeCompany.name)}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">
                                {activeCompany.name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{activeCompany.role}</p>
                        </div>
                    </>
                ) : (
                    <>
                        <Building2 size={20} className="text-gray-400" />
                        <span className="text-gray-500">Seleccionar empresa</span>
                    </>
                )}
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tus Empresas</p>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1">
                        {companies.map((company) => (
                            <button
                                key={company.id}
                                onClick={() => handleSelectCompany(company.id)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 
                  hover:bg-gray-50 transition-colors duration-150
                  ${company.id === activeCompany?.id ? 'bg-teal-50' : ''}
                `}
                            >
                                <div className={`w-9 h-9 rounded-lg ${getColorClass(company.name)} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                                    {getInitials(company.name)}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-gray-800">{company.name}</p>
                                    <p className="text-xs text-gray-500">{company.tax_id}</p>
                                </div>
                                {company.id === activeCompany?.id && (
                                    <Check size={16} className="text-teal-500" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-1 mt-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onCreateClick();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors duration-150 text-teal-600"
                        >
                            <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
                                <Plus size={18} className="text-teal-600" />
                            </div>
                            <span className="text-sm font-medium">Crear nueva empresa</span>
                        </button>

                        {activeCompany && (
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/company/settings');
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors duration-150 text-gray-600"
                            >
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Settings size={18} className="text-gray-500" />
                                </div>
                                <span className="text-sm font-medium">Configuración de empresa</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
