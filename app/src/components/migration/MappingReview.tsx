import { useState } from 'react';
import type { DetectedFile } from '../../services/migration';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';

interface MappingReviewProps {
    files: DetectedFile[];
    onComplete: () => void;
    onBack: () => void;
}

export default function MappingReview({ files, onComplete, onBack }: MappingReviewProps) {
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const currentFile = files[currentFileIndex];

    const nextFile = () => {
        if (currentFileIndex < files.length - 1) setCurrentFileIndex(currentFileIndex + 1);
    };

    const prevFile = () => {
        if (currentFileIndex > 0) setCurrentFileIndex(currentFileIndex - 1);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Verificación de Datos</h2>
                    <p className="text-sm text-gray-500">Revisa los datos antes de importar ({currentFileIndex + 1} de {files.length})</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevFile}
                        disabled={currentFileIndex === 0}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-medium text-gray-700 min-w-[150px] text-center truncate px-2">
                        {currentFile.name}
                    </span>
                    <button
                        onClick={nextFile}
                        disabled={currentFileIndex === files.length - 1}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Data Preview Table */}
            <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-medium">
                            <tr>
                                {currentFile.columns.map((col, i) => (
                                    <th key={i} className="px-4 py-3 whitespace-nowrap border-b border-gray-200">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentFile.preview.map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    {currentFile.columns.map((col, j) => (
                                        <td key={j} className="px-4 py-2 whitespace-nowrap text-gray-600">
                                            {String(row[j] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 px-4 py-2 border-t text-xs text-gray-500 text-center">
                    Mostrando 5 de {currentFile.rowCount} registros
                </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                    Atrás
                </button>
                <button
                    onClick={onComplete}
                    className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 flex items-center gap-2"
                >
                    <Save size={18} /> Confirmar Importación Total
                </button>
            </div>
        </div>
    );
}
