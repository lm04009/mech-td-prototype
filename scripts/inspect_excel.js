
const xlsx = require('xlsx');
const path = require('path');

function inspectExcel(filename) {
    const filePath = path.join('openspec', 'design_src', filename);
    console.log(`--- Inspecting ${filename} ---`);
    try {
        const workbook = xlsx.readFile(filePath);
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
            console.log(`Sheet: ${sheetName}`);
            console.log(`Rows found: ${data.length}`);
            if (data.length > 0) {
                data.slice(0, 5).forEach((row, i) => {
                    console.log(`Row ${i}:`, row);
                });
            }
            console.log('---');
        });
    } catch (err) {
        console.error(`Error reading ${filename}: ${err.message}`);
    }
}

const files = [
    'Enemies.xlsx',
    'MechParts.xlsx',
    'MechWeapons.xlsx',
    'SystemConstants.xlsx'
];

files.forEach(inspectExcel);
