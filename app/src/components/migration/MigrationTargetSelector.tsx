
import { useState } from 'react';
import { Building2, Plus, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';

interface MigrationTargetSelectorProps {
    onSelect: (target: 'new' | 'existing', companyName?: string) => void;
    onBack: () => void;
}

export default function MigrationTargetSelector({ onSelect, onBack }: MigrationTargetSelectorProps) {
    const { activeCompany } = useCompany();
    const [selection, setSelection] = useState<'new' | 'existing'>('new');
    const [newCompanyName, setNewCompanyName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleContinue = () => {
        if (selection === 'new') {
            if (!newCompanyName.trim()) {
                setError('Por favor ingresa un nombre para la nueva empresa.');
                return;
            }
            onSelect('new', newCompanyName);
        } else {
            onSelect('existing');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona el Destino de los Datos</h2>
                <p className="text-gray-500">Elige dónde quieres importar la información detectada en el archivo ZIP.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
                {/* Option 1: New Company */}
                <div
                    onClick={() => { setSelection('new'); setError(null); }}
                    className={`
                        relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300
                        ${selection === 'new'
                            ? 'border-teal-500 bg-teal-50/50 shadow-lg shadow-teal-500/10'
                            : 'border-gray-200 hover:border-teal-200 hover:bg-gray-50'
                        }
                    `}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center
                            ${selection === 'new' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500'}
                        `}>
                            <Plus size={24} />
                        </div>
                        {selection === 'new' && (
                            <CheckCircle2 className="text-teal-500 animate-in fade-in zoom-in" size={24} />
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">Crear Nueva Empresa</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Opción Recomendada. Crea un espacio limpio y aislado para los datos importados. Evita mezclar información y asegura la integridad contable.
                    </p>

                    <div className={`space-y-2 transition-all duration-300 ${selection === 'new' ? 'opacity-100 max-h-24' : 'opacity-50 max-h-24'}`}>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Nombre de la Empresa
                        </label>
                        <input
                            type="text"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            placeholder="Ej: Inversiones 2024 C.A."
                            disabled={selection !== 'new'}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Option 2: Existing Company */}
                <div
                    onClick={() => { setSelection('existing'); setError(null); }}
                    className={`
                        relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300
                        ${selection === 'existing'
                            ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-500/10'
                            : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                        }
                    `}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center
                            ${selection === 'existing' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}
                        `}>
                            <Building2 size={24} />
                        </div>
                        {selection === 'existing' && (
                            <CheckCircle2 className="text-orange-500 animate-in fade-in zoom-in" size={24} />
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">Usar Empresa Actual</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Importar los datos en:
                        <span className="block mt-1 font-semibold text-gray-700">
                            {activeCompany?.name || 'Empresa No Seleccionada'}
                        </span>
                    </p>

                    <div className="flex items-start gap-3 p-3 bg-orange-100/50 text-orange-800 rounded-xl text-sm border border-orange-200">
                        <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                        <p>
                            Advertencia: Los datos importados se mezclarán con la contabilidad existente. Esta acción no se puede deshacer fácilmente.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="max-w-md mx-auto mb-8 text-center text-red-600 bg-red-50 px-4 py-2 rounded-lg animate-in fade-in">
                    {error}
                </div>
            )}

            <div className="flex justify-between items-center pt-8 border-t border-gray-100">
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                    Atrás
                </button>
                <button
                    onClick={handleContinue}
                    className={`
                        px-8 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95
                        ${selection === 'new'
                            ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/25'
                            : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/25'
                        }
                    `}
                >
                    Continuar
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
