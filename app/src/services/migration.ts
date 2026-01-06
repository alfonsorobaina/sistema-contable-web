import { read, utils } from 'xlsx';
import JSZip from 'jszip';

export interface DetectedFile {
    name: string;
    type: 'dbf' | 'excel' | 'csv' | 'unknown';
    rowCount: number;
    columns: string[];
    preview: any[];
    data: any[]; // Full data payload
    originalEntry: JSZip.JSZipObject;
}

export const MigrationService = {
    /**
     * Analyzes a list of ZIP entries and attempts to parse them as data tables.
     */
    async analyzeFiles(files: { name: string, entry: JSZip.JSZipObject }[]): Promise<DetectedFile[]> {
        const results: DetectedFile[] = [];

        for (const file of files) {
            const lowerName = file.name.toLowerCase();
            let type: 'dbf' | 'excel' | 'csv' | 'unknown' = 'unknown';

            if (lowerName.endsWith('.dbf')) type = 'dbf';
            else if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) type = 'excel';
            else if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) type = 'csv';

            if (type !== 'unknown') {
                try {
                    console.log(`Analyzing file: ${file.name} (Type: ${type})`);
                    // Load content based on type
                    const blob = await file.entry.async('blob');
                    const arrayBuffer = await blob.arrayBuffer();
                    console.log(`Buffer size for ${file.name}: ${arrayBuffer.byteLength} bytes`);

                    // Parse with SheetJS
                    const workbook = read(arrayBuffer, { type: 'array', cellDates: true, dense: true });

                    if (workbook.SheetNames.length === 0) {
                        console.warn(`No sheets found in ${file.name}`);
                        // Still add it so user knows it exists but is empty/unreadable
                        results.push({
                            name: file.name,
                            type,
                            rowCount: 0,
                            columns: [],
                            preview: [],
                            data: [],
                            originalEntry: file.entry
                        });
                        continue;
                    }

                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];

                    // Convert to JSON
                    const jsonData = utils.sheet_to_json(sheet, { header: 1 });
                    console.log(`Parsed ${file.name}: ${jsonData.length} rows`);

                    let headers: string[] = [];
                    let rows: any[] = [];

                    if (jsonData.length > 0) {
                        headers = jsonData[0] as string[];
                        rows = jsonData.slice(1);
                    }

                    // Always add the file, even if empty, so the user sees it
                    results.push({
                        name: file.name,
                        type,
                        rowCount: rows.length,
                        columns: headers,
                        preview: rows.slice(0, 5),
                        data: rows,
                        originalEntry: file.entry
                    });
                } catch (err) {
                    console.error(`Failed to parse ${file.name}`, err);
                    // Add as error entry if possible, or just skip? 
                    // Better to skip for now to avoid crashing UI with bad objects, 
                    // but logging is key.
                }
            } else {
                console.log(`Skipping unknown file type: ${file.name}`);
            }
        }

        return results;
    },

    /**
     * Fuzzy match helper to map legacy columns (e.g., 'SUELDO_MEN') to our schema ('base_salary')
     */
    suggestMapping(columns: string[], targetSchema: string[]): Record<string, string> {
        const mapping: Record<string, string> = {};

        // Simple heuristic: normalization and partial match
        columns.forEach(col => {
            const normCol = col.toLowerCase().replace(/[^a-z0-9]/g, '');

            // Try to find a match in target schema
            const match = targetSchema.find(target => {
                const normTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
                return normCol.includes(normTarget) || normTarget.includes(normCol);
            });

            if (match) {
                mapping[match] = col;
            }
        });

        return mapping;
    }
};
