import { RawSourceRow, StandardMISRecord, CategoryMappingRule } from '../types';
import { parseExcelOrStringDate } from './date';
import { parseNumberSafely } from './currency';
import { mapCategory } from './categories';

export interface TransformResult {
  records: StandardMISRecord[];
  validCount: number;
  warningCount: number;
  errorCount: number;
  potentialDuplicateCount: number;
  duplicateKeys: Set<string>;
}

export function transformRawRows(
  rows: RawSourceRow[],
  mapping: Record<string, string>,
  batchId: string,
  categoryRules?: CategoryMappingRule[],
  existingRecords?: StandardMISRecord[]
): TransformResult {
  const records: StandardMISRecord[] = [];
  const duplicateKeyTracker = new Map<string, number>();

  // If existing records exist, register their duplicate keys
  if (existingRecords && existingRecords.length > 0) {
    for (const r of existingRecords) {
      if (r.duplicateGroupKey) {
        duplicateKeyTracker.set(r.duplicateGroupKey, (duplicateKeyTracker.get(r.duplicateGroupKey) || 0) + 1);
      }
    }
  }

  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let potentialDuplicateCount = 0;

  rows.forEach((row, index) => {
    const notes: string[] = [];
    let isError = false;
    let isWarning = false;

    // Helper to get raw cell value preserving text string representation
    const getVal = (fieldKey: string): any => {
      const colName = mapping[fieldKey];
      if (!colName || row[colName] === undefined) return '';
      return row[colName];
    };

    const getStringVal = (fieldKey: string): string => {
      const val = getVal(fieldKey);
      if (val === null || val === undefined) return '';
      return String(val).trim();
    };

    // Client Name & ID
    const clientName = getStringVal('clientName');
    const clientId = getStringVal('clientId');

    // Patient Name & ID
    const patientName = getStringVal('patientName');
    const patientId = getStringVal('patientId');

    // Plan Item Name
    const planItem = getStringVal('planItem') || 'Unnamed Service';
    if (!getStringVal('planItem')) {
      notes.push('Missing Plan Item Name');
      isWarning = true;
    }

    // Plan Item Quantity
    const rawQty = getVal('quantity');
    let quantity = 1;
    if (rawQty !== '' && rawQty !== null && rawQty !== undefined) {
      const parsedQty = parseNumberSafely(rawQty);
      if (parsedQty !== null && !isNaN(parsedQty)) {
        quantity = parsedQty;
      } else {
        notes.push(`Invalid quantity "${rawQty}", defaulted to 1`);
        isWarning = true;
      }
    }

    // Provider / Performed Staff
    const rawProvider = getStringVal('provider');
    const provider = rawProvider || 'Unassigned Staff';
    if (!rawProvider) {
      notes.push('Missing Performed Staff');
      isWarning = true;
    }

    // Branch
    const rawBranch = getStringVal('branch');
    const branch = rawBranch || 'Main Branch';
    if (!rawBranch) {
      notes.push('Missing Branch, defaulted to Main Branch');
      isWarning = true;
    }

    // Invoice No
    const invoiceNo = getStringVal('invoiceNo');
    if (!invoiceNo) {
      notes.push('Missing Invoice Number');
      isWarning = true;
    }

    // Invoice Date
    const rawDate = getVal('invoiceDate');
    const parsedDate = parseExcelOrStringDate(rawDate);
    let invoiceDate = '';
    let month = '';
    let year = '';

    if (parsedDate) {
      invoiceDate = parsedDate.dateStr;
      month = parsedDate.monthStr;
      year = parsedDate.yearStr;
    } else {
      notes.push('Invalid or missing Invoice Date');
      isError = true;
      invoiceDate = 'Missing Date';
      month = 'Missing Month';
      year = 'Missing Year';
    }

    // Billed Amount - Critical rule: NEVER multiply by quantity!
    const rawAmount = getVal('billedAmount');
    const parsedAmount = parseNumberSafely(rawAmount);
    let billedAmount = 0;

    if (parsedAmount !== null && !isNaN(parsedAmount)) {
      billedAmount = parsedAmount;
      if (billedAmount < 0) {
        notes.push(`Negative billed amount: ₹${billedAmount}`);
        isWarning = true;
      } else if (billedAmount === 0) {
        notes.push('Zero-value service line');
        // Legitimate zero-value line, keep it without error
      }
    } else {
      notes.push(`Invalid unparseable Billed Amount "${rawAmount}"`);
      isError = true;
      billedAmount = 0;
    }

    // Service Category
    const rawCategory = getStringVal('serviceCategory');
    const { mappedCategory, needsReview } = mapCategory(rawCategory, categoryRules);
    if (needsReview) {
      notes.push(`Category "${rawCategory || 'Empty'}" needs review`);
      isWarning = true;
    }

    // Duplicate detection key:
    // Distinguish multi-service lines on same invoice from exact duplicate lines!
    // Key: invoiceNo + planItem + provider + billedAmount + patientId
    const dupKey = `${(invoiceNo || 'noinv').toLowerCase()}|${planItem.toLowerCase()}|${provider.toLowerCase()}|${billedAmount}|${(patientId || 'nopid').toLowerCase()}`;
    const previousOccurrences = duplicateKeyTracker.get(dupKey) || 0;
    duplicateKeyTracker.set(dupKey, previousOccurrences + 1);

    let isPotentialDuplicate = false;
    if (previousOccurrences > 0 && invoiceNo) {
      isPotentialDuplicate = true;
      potentialDuplicateCount++;
      notes.push(`Potential duplicate service line (Invoice #${invoiceNo}, Item: ${planItem})`);
      isWarning = true;
    }

    // Determine overall validation status
    let validationStatus: 'Valid' | 'Warning' | 'Error' = 'Valid';
    if (isError) {
      validationStatus = 'Error';
      errorCount++;
    } else if (isWarning) {
      validationStatus = 'Warning';
      warningCount++;
    } else {
      validCount++;
    }

    const record: StandardMISRecord = {
      id: `${batchId}-row-${index + 1}-${Date.now().toString(36)}`,
      clientName: clientName || 'Walk-in Client',
      clientId: clientId || 'N/A',
      patientName: patientName || 'Patient',
      patientId: patientId || 'N/A',
      provider,
      planItem,
      quantity,
      serviceCategory: mappedCategory,
      rawCategory: rawCategory || 'Uncategorized',
      invoiceDate,
      month,
      year,
      invoiceNo: invoiceNo || 'INV-PENDING',
      billedAmount,
      branch,
      importBatchId: batchId,
      validationStatus,
      notes,
      isPotentialDuplicate,
      duplicateGroupKey: dupKey,
      needsCategoryReview: needsReview,
    };

    records.push(record);
  });

  const duplicateKeys = new Set<string>();
  duplicateKeyTracker.forEach((count, key) => {
    if (count > 1) duplicateKeys.add(key);
  });

  return {
    records,
    validCount,
    warningCount,
    errorCount,
    potentialDuplicateCount,
    duplicateKeys,
  };
}
