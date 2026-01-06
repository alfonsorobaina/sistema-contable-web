import { useState } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertTriangle, Building, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import UploadStep from '../components/migration/UploadStep';
import AnalysisReport from '../components/migration/AnalysisReport';
import MappingReview from '../components/migration/MappingReview';
import MigrationTargetSelector from '../components/migration/MigrationTargetSelector';
import { MigrationService } from '../services/migration';
import type { DetectedFile } from '../services/migration';
import { useCompany } from '../context/CompanyContext';
import { supabase } from '../lib/supabase';

export type MigrationStep = 'upload' | 'analyze' | 'target_selection' | 'map' | 'import';

export default function DataMigration() {
    const { refreshCompanies } = useCompany();
    const [step, setStep] = useState<MigrationStep>('upload');
    const [analyzedFiles, setAnalyzedFiles] = useState<DetectedFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<DetectedFile[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Target Selection State
    const [targetType, setTargetType] = useState<'new' | 'existing'>('existing');
    const [targetCompanyId, setTargetCompanyId] = useState<string | null>(null);

    const handleFilesSelected = async (files: any[]) => {
        setIsAnalyzing(true);
        try {
            // Perform real analysis using SheetJS
            const results = await MigrationService.analyzeFiles(files);
            setAnalyzedFiles(results);
            setStep('analyze');
        } catch (error) {
            console.error("Error analyzing files", error);
            alert("Error al analizar los archivos. Por favor intenta de nuevo.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAnalysisComplete = (selected: DetectedFile[]) => {
        setSelectedFiles(selected);
        setStep('target_selection');
    };

    const handleTargetSelected = async (type: 'new' | 'existing', companyName?: string) => {
        if (type === 'new' && companyName) {
            try {
                // Create new company
                const { data, error } = await supabase.rpc('create_company', {
                    p_name: companyName,
                    p_address: 'Dirección pendiente',
                    p_phone: 'N/A',
                    p_email: 'pendiente@email.com',
                    p_tax_id: 'J-00000000-0',
                    p_currency_symbol: 'Bs.'
                });

                if (error) throw error;

                // Refresh context to show new company
                await refreshCompanies();

                // Set the new company as target (assuming create_company returns the ID or object)
                // If it returns just ID, use it. If object, use .id
                // Based on standard RPC patterns, let's assume it returns the ID or the row.
                // For now, we will proceed to mapping. Ideally we switch active company here too.
                console.log('Company created:', data);

                setTargetType('new');
                setStep('map');

            } catch (err) {
                console.error('Error creating company:', err);
                alert('No se pudo crear la empresa. Por favor intenta de nuevo.');
                return;
            }
        } else {
            setTargetType('existing');
            setStep('map');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2">
                    <ArrowLeft size={16} /> Volver al Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Migración de Datos Inteligente</h1>
                <p className="text-gray-500">Importa tus datos desde otros sistemas (SGT, Saint, Profit Plus) usando Inteligencia Artificial.</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between px-10 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <StepIndicator current={step} step="upload" icon={Upload} label="Cargar ZIP" />
                <Connector active={step !== 'upload'} />
                <StepIndicator current={step} step="analyze" icon={FileText} label="Análisis IA" />
                <Connector active={step !== 'upload' && step !== 'analyze'} />
                <StepIndicator current={step} step="target_selection" icon={Building} label="Destino" />
                <Connector active={step === 'map' || step === 'import'} />
                <StepIndicator current={step} step="map" icon={AlertTriangle} label="Verificación" />
                <Connector active={step === 'import'} />
                <StepIndicator current={step} step="import" icon={CheckCircle} label="Importar" />
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
                {step === 'upload' && (
                    <UploadStep onFileSelected={handleFilesSelected} />
                )}

                {step === 'analyze' && (
                    <AnalysisReport
                        files={analyzedFiles}
                        onContinue={handleAnalysisComplete}
                        onBack={() => setStep('upload')}
                    />
                )}

                {step === 'target_selection' && (
                    <MigrationTargetSelector
                        onSelect={handleTargetSelected}
                        onBack={() => setStep('analyze')}
                    />
                )}

                {step === 'map' && (
                    <MappingReview
                        files={selectedFiles}
                        onComplete={() => setStep('import')} // TODO: Trigger actual import
                        onBack={() => setStep('target_selection')}
                    />
                )}

                {step === 'import' && (
                    <div className="text-center py-20">
                        <h2 className="text-xl font-bold text-gray-800">Importando datos...</h2>
                        <p className="text-gray-500">Esto puede tomar unos minutos.</p>
                    </div>
                )}
            </div>

            {/* Loading Overlay */}
            {isAnalyzing && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Analizando Archivos...</h3>
                        <p className="text-gray-500">Nuestra IA está identificando la estructura de tus datos</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function StepIndicator({ current, step, icon: Icon, label }: { current: string, step: string, icon: any, label: string }) {
    const steps = ['upload', 'analyze', 'target_selection', 'map', 'import'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(step);

    const isActive = step === current;
    const isCompleted = stepIndex < currentIndex;

    return (
        <div className={`flex flex - col items - center gap - 2 relative z - 10 ${isActive ? 'text-teal-600' : isCompleted ? 'text-teal-600' : 'text-gray-400'} `}>
            <div className={`
w - 10 h - 10 rounded - full flex items - center justify - center transition - all duration - 300
                ${isActive ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' :
                    isCompleted ? 'bg-teal-100 text-teal-600' : 'bg-gray-100'
                }
`}>
                <Icon size={20} />
            </div>
            <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
        </div>
    );
}

function Connector({ active }: { active: boolean }) {
    return (
        <div className={`h-0.5 flex-1 mx-4 transition-colors duration-500 ${active ? 'bg-teal-200' : 'bg-gray-100'}`} />
    );
}
