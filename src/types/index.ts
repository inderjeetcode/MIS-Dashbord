export interface RawSourceRow {
  [key: string]: any;
}

export interface StandardMISRecord {
  id: string; // unique internal record id
  clientName: string;
  clientId: string; // preserved as text with leading zeros
  patientName: string;
  patientId: string; // preserved as text with leading zeros
  provider: string; // Performed Staff
  planItem: string; // Plan Item Name
  quantity: number; // Plan Item Quantity
  serviceCategory: string; // Normalized or mapped
  rawCategory: string; // Original source category
  invoiceDate: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  year: string; // YYYY
  invoiceNo: string; // preserved as text with leading zeros
  billedAmount: number; // Exactly the line total; NEVER multiplied by quantity
  branch: string;
  importBatchId: string;
  validationStatus: 'Valid' | 'Warning' | 'Error';
  notes: string[];
  isPotentialDuplicate?: boolean;
  duplicateGroupKey?: string;
  needsCategoryReview?: boolean;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  fileType: 'xlsx' | 'xls' | 'csv';
  reportType: string;
  importedAt: string; // ISO string
  sourceRowCount: number;
  validCount: number;
  warningCount: number;
  rejectedCount: number;
  potentialDuplicateCount: number;
  status: 'Completed' | 'Completed with Warnings' | 'Failed';
  summaryNotes?: string[];
  columnMappingUsed: Record<string, string>;
}

export interface FilterState {
  period: string; // 'all' | 'fy26-td' | 'cur-month' | 'prev-month' | 'custom'
  startDate?: string;
  endDate?: string;
  branch: string; // 'all' or branch name
  provider: string; // 'all' or provider name
  category: string; // 'all' or category name
  validationStatus: string; // 'all' | 'Valid' | 'Warning' | 'Error' | 'needs-review' | 'duplicates'
  searchQuery: string;
}

export interface CategoryMappingRule {
  id: string;
  pattern: string; // lowercase match string
  targetCategory: string;
  isRegex?: boolean;
}

export interface BranchMappingRule {
  id: string;
  rawBranch: string;
  standardBranch: string;
}

export interface ValidationRulesConfig {
  flagZeroBilledAmount: boolean;
  flagNegativeBilledAmount: boolean;
  flagMissingProvider: boolean;
  flagMissingBranch: boolean;
  flagUnmappedCategory: boolean;
  flagDuplicateServiceLines: boolean;
}
