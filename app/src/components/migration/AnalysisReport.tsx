import { useState } from 'react';
import { FileText, Table, Database, CheckSquare, Square } from 'lucide-react';
import type { DetectedFile } from '../../services/migration';

interface AnalysisReportProps {
    files: DetectedFile[];
    onContinue: (selectedFiles: DetectedFile[]) => void;
    onBack: () => void;
}

export default function AnalysisReport({ files, onContinue, onBack }: AnalysisReportProps) {
    const [selectedIndices, setSelectedIndices] = useState<number[]>(files.map((_, i) => i)); // Select all by default

    const toggleSelection = (index: number) => {
        if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
        } else {
            setSelectedIndices([...selectedIndices, index]);
        }
    };

    const getFileInfo = (type: string) => {
        if (type === 'dbf') return { type: 'Base de Datos (DBF)', icon: Database, color: 'text-amber-600 bg-amber-100' };
        if (type === 'excel') return { type: 'Hoja de Excel', icon: Table, color: 'text-green-600 bg-green-100' };
        return { type: 'Archivo de Texto/CSV', icon: FileText, color: 'text-gray-600 bg-gray-100' };
    };

    const totalRecords = files.filter((_, i) => selectedIndices.includes(i)).reduce((acc, f) => acc + f.rowCount, 0);

    const handleContinue = () => {
        const selected = files.filter((_, i) => selectedIndices.includes(i));
        onContinue(selected);
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-800">Reporte de Análisis</h2>
                <p className="text-gray-500 mb-4">Hemos analizado el contenido de tu archivo ZIP.</p>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    Seleccionados: {selectedIndices.length} archivos ({totalRecords} registros)
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                {files.map((file, idx) => {
                    const info = getFileInfo(file.type);
                    const Icon = info.icon;
                    const isSelected = selectedIndices.includes(idx);

                    return (
                        <div
                            key={idx}
                            onClick={() => toggleSelection(idx)}
                            className={`
                                flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all
                                ${isSelected ? 'bg-teal-50/50 border-teal-200 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 flex items-center justify-center mr-2 text-teal-600`}>
                                    {isSelected ? <CheckSquare size={24} /> : <Square size={24} className="text-gray-300" />}
                                </div>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${info.color}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                        {file.name}
                                        <span className="text-xs font-normal text-gray-500">
                                            ({file.rowCount.toLocaleString()} filas)
                                        </span>
                                    </h4>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 border px-1.5 rounded">{info.type}</span>
                                        {file.columns.slice(0, 3).map(c => (
                                            <span key={c} className="text-[10px] text-gray-400 bg-gray-100 px-1.5 rounded truncate max-w-[80px]">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                    Atrás
                </button>
                <button
                    onClick={handleContinue}
                    disabled={selectedIndices.length === 0}
                    className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Confirmar Selección
                </button>
            </div>
        </div>
    );
}
