const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const DESIGN_SRC_DIR = path.join('openspec', 'design_src');
const DATA_DEST_DIR = path.join('src', 'data');

if (!fs.existsSync(DATA_DEST_DIR)) {
    fs.mkdirSync(DATA_DEST_DIR, { recursive: true });
}

function convertFile(filename, outputName, isGrouped = false) {
    const inputPath = path.join(DESIGN_SRC_DIR, filename);
    const outputPath = path.join(DATA_DEST_DIR, outputName);

    console.log(`Processing: ${filename} -> ${outputName}`);

    if (!fs.existsSync(inputPath)) {
        console.warn(`Warning: ${filename} not found, skipping.`);
        return;
    }

    const workbook = xlsx.readFile(inputPath);
    let resultData;

    if (isGrouped) {
        resultData = {};
        workbook.SheetNames.forEach(sheetName => {
            if (sheetName.startsWith('#')) return;
            const data = processSheet(workbook.Sheets[sheetName]);
            if (data.length > 0) {
                resultData[sheetName] = data;
            }
        });
    } else {
        // Find the first non-# sheet
        const validSheetName = workbook.SheetNames.find(n => !n.startsWith('#'));
        if (validSheetName) {
            resultData = processSheet(workbook.Sheets[validSheetName]);
        } else {
            resultData = [];
        }
    }

    fs.writeFileSync(outputPath, JSON.stringify(resultData, null, 2));
    console.log(`Successfully wrote ${outputName}`);
}

function processSheet(sheet) {
    const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (raw.length === 0) return [];

    // Helper to detect non-ASCII (Japanese)
    const hasJapanese = (str) => typeof str === 'string' && /[^\x00-\x7F]/.test(str);

    // Heuristic 1: Find the Header Row (Row with English Keys)
    let headerRowIndex = 0;
    // Check if the current header row has Japanese. If so, move to the next row.
    if (raw[0] && raw[0].some(cell => hasJapanese(cell))) {
        headerRowIndex = 1;
    }

    const headers = raw[headerRowIndex];
    if (!headers || headers.length === 0) return [];

    // Heuristic 2: Determine if there is a Type Row (uint, string, etc.)
    const typeRowIndex = headerRowIndex + 1;
    let dataStartRowIndex = typeRowIndex;

    const typeKeywords = ['uint', 'int', 'string', 'float', 'bool', 'null', 'int4'];
    if (raw[typeRowIndex]) {
        const isTypeRow = raw[typeRowIndex].some(cell =>
            cell && typeof cell === 'string' && typeKeywords.includes(cell.toLowerCase())
        );
        if (isTypeRow) {
            dataStartRowIndex = typeRowIndex + 1;
        }
    }

    const dataRows = raw.slice(dataStartRowIndex);
    const results = [];

    dataRows.forEach(row => {
        if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
            return;
        }

        const obj = {};
        let hasValue = false;

        headers.forEach((header, colIndex) => {
            // Skip columns with no header or starting with #
            if (!header || header.toString().startsWith('#')) return;

            let val = row[colIndex];
            if (val === undefined || val === null) val = null;

            // Optional: convert string-wrapped numbers to actual Numbers
            if (val !== null && !isNaN(val) && typeof val === 'string' && val.trim() !== '') {
                val = Number(val);
            }

            obj[header] = val;
            if (val !== null) hasValue = true;
        });

        if (hasValue) {
            results.push(obj);
        }
    });

    return results;
}

// Execution
convertFile('MechParts.xlsx', 'parts.json', true);
convertFile('MechWeapons.xlsx', 'weapons.json', true);
convertFile('Enemies.xlsx', 'enemies.json', false);
convertFile('SystemConstants.xlsx', 'constants.json', false);

console.log('\n--- Data Baking Complete ---');
