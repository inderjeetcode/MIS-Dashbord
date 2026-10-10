import * as XLSX from 'xlsx';
import { RawSourceRow } from '../types';

export interface ParsedFileData {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  activeSheet: string;
  headers: string[];
  rows: RawSourceRow[];
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedFileData> {
  const data = await file.arrayBuffer();
  // read workbook with cellText and raw=false to preserve leading zeros in client ID, invoice no, patient ID
  const workbook = XLSX.read(data, {
    type: 'array',
    cellDates: true,
    cellText: true,
  });

  const firstSheetName = workbook.SheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert worksheet to JSON rows with string formatting preserved
  const rows: RawSourceRow[] = XLSX.utils.sheet_to_json(worksheet, {
    raw: false,
    defval: '',
    blankrows: false,
  });

  // Extract headers from worksheet range or first row
  let headers: string[] = [];
  if (rows.length > 0) {
    headers = Object.keys(rows[0]);
  } else if (worksheet['!ref']) {
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: C });
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        headers.push(String(cell.v));
      }
    }
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    sheetNames: workbook.SheetNames,
    activeSheet: firstSheetName,
    headers,
    rows,
  };
}
