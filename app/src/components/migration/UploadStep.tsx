import { useState, useCallback } from 'react';
import { Upload, FileArchive, X, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';

interface UploadStepProps {
    onFileSelected: (files: any[]) => void;
}

export default function UploadStep({ onFileSelected }: UploadStepProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        console.log('File detected:', file.name, 'Size:', file.size, 'Type:', file.type);

        // Validation for ZIP extension
        if (!file.name.toLowerCase().endsWith('.zip')) {
            setError('Por favor sube un archivo ZIP.');
            return;
        }

        if (file.size === 0) {
            setError('El archivo está vacío (0 bytes).');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Test reading the file buffer first to rule out JSZip issues
            try {
                await file.slice(0, 1).arrayBuffer();
                console.log('File access test successful');
            } catch (readErr) {
                console.error('File access test failed:', readErr);
                throw new Error('No se puede leer el archivo. Verifique que no esté abierto en otro programa.');
            }

            const zip = new JSZip();
            const content = await zip.loadAsync(file);
            const files: any[] = [];

            console.log('ZIP loaded. Entries:', Object.keys(content.files).length);

            // Quick scan of files
            content.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir && !relativePath.startsWith('__MACOSX')) {
                    files.push({
                        name: zipEntry.name,
                        path: relativePath,
                        entry: zipEntry
                    });
                }
            });

            if (files.length === 0) {
                setError('El archivo ZIP está vacío o solo contiene carpetas.');
                setLoading(false);
                return;
            }

            // Simulate parsing delay
            setTimeout(() => {
                onFileSelected(files);
                setLoading(false);
            }, 1000);

        } catch (err: any) {
            console.error('Upload Error:', err);
            const msg = err.message || 'Error desconocido';
            setError(msg.includes('No se puede leer') ? msg : 'Error al procesar el ZIP. Asegúrate de que sea un archivo ZIP válido.');
            setLoading(false);
        }
    }, [onFileSelected]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/zip': ['.zip'],
            'application/x-zip-compressed': ['.zip'],
            'application/x-compressed': ['.zip']
        },
        multiple: false
    });

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <div
                {...getRootProps()}
                className={`
                    w-full max-w-2xl border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer outline-none relative
                    ${isDragActive ? 'border-teal-500 bg-teal-50 scale-[1.02]' : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'}
                    ${isDragReject ? 'border-red-500 bg-red-50' : ''}
                    ${loading ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                <input {...getInputProps()} />

                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors ${isDragReject ? 'bg-red-100 text-red-500' : 'bg-teal-100 text-teal-600'}`}>
                    {loading ? <Loader2 size={32} className="animate-spin" /> : <FileArchive size={32} />}
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {loading ? 'Analizando estructura del ZIP...' : isDragActive ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo de Respaldo (ZIP)'}
                </h3>

                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    {loading
                        ? 'Nuestra IA está identificando los formatos de archivo (DBF, Excel, TXT) para sugerirte la mejor importación.'
                        : 'Soporta respaldos de SGT Contable, Profit Plus, Galac y archivos DBF/Excel sueltos.'}
                </p>

                {!loading && (
                    <button className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors pointer-events-none">
                        Seleccionar Archivo
                    </button>
                )}
            </div>

            {error && (
                <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                    <X size={18} />
                    {error}
                </div>
            )}
        </div>
    );
}
