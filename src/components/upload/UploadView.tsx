import React, { useState, useRef } from 'react';
import { RawSourceRow, StandardMISRecord, ImportBatch, CategoryMappingRule } from '../../types';
import { parseSpreadsheetFile } from '../../utils/fileParser';
import { autoMapColumns, MIS_STANDARD_FIELDS } from '../../utils/columnMapper';
import { transformRawRows, TransformResult } from '../../utils/transformer';
import { downloadVETportTemplate, exportRecordsToExcel } from '../../utils/exporter';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ArrowRight,
  RefreshCw,
  FileDown,
  Layers,
  Check,
  ChevronDown,
} from 'lucide-react';
import { formatINR } from '../../utils/currency';

interface UploadViewProps {
  onImportComplete: (batch: ImportBatch, newRecords: StandardMISRecord[]) => void;
  existingRecords: StandardMISRecord[];
  categoryRules?: CategoryMappingRule[];
}

export const UploadView: React.FC<UploadViewProps> = ({
  onImportComplete,
  existingRecords,
  categoryRules,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload workflow state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Select, 2: Preview & Map, 3: Validate, 4: Confirmed
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState<string>('VETport Sales Report');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawSourceRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation state
  const [transformResult, setTransformResult] = useState<TransformResult | null>(null);
  const [excludeDuplicates, setExcludeDuplicates] = useState<boolean>(false);
  const [excludeErrors, setExcludeErrors] = useState<boolean>(true);
  const [importedBatch, setImportedBatch] = useState<ImportBatch | null>(null);

  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const parsed = await parseSpreadsheetFile(file);
      if (parsed.rows.length === 0) {
        throw new Error('The uploaded file contains no data rows.');
      }

      setSelectedFile(file);
      setParsedHeaders(parsed.headers);
      setRawRows(parsed.rows);

      // Perform automatic column mapping
      const autoMapping = autoMapColumns(parsed.headers);
      setColumnMapping(autoMapping);

      // Pre-run transformation preview
      const batchId = `batch-${Date.now().toString(36)}`;
      const result = transformRawRows(parsed.rows, autoMapping, batchId, categoryRules, existingRecords);
      setTransformResult(result);

      setStep(2);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to read spreadsheet file. Please check file format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleMappingChange = (fieldKey: string, sourceCol: string) => {
    const updated = { ...columnMapping, [fieldKey]: sourceCol };
    setColumnMapping(updated);

    // Re-run transformation with updated mapping
    if (rawRows.length > 0) {
      const batchId = `batch-${Date.now().toString(36)}`;
      const result = transformRawRows(rawRows, updated, batchId, categoryRules, existingRecords);
      setTransformResult(result);
    }
  };

  const handleProceedToValidation = () => {
    setStep(3);
  };

  const handleConfirmImport = () => {
    if (!transformResult || !selectedFile) return;

    let finalRecords = [...transformResult.records];

    if (excludeErrors) {
      finalRecords = finalRecords.filter((r) => r.validationStatus !== 'Error');
    }

    if (excludeDuplicates) {
      finalRecords = finalRecords.filter((r) => !r.isPotentialDuplicate);
    }

    const batchId = `batch-${Date.now().toString(36)}`;
    const ext = selectedFile.name.endsWith('.csv')
      ? 'csv'
      : selectedFile.name.endsWith('.xls')
      ? 'xls'
      : 'xlsx';

    const batch: ImportBatch = {
      id: batchId,
      fileName: selectedFile.name,
      fileType: ext as any,
      reportType,
      importedAt: new Date().toISOString(),
      sourceRowCount: rawRows.length,
      validCount: transformResult.validCount,
      warningCount: transformResult.warningCount,
      rejectedCount: transformResult.errorCount,
      potentialDuplicateCount: transformResult.potentialDuplicateCount,
      status: transformResult.errorCount > 0 ? 'Completed with Warnings' : 'Completed',
      summaryNotes: [
        `Processed ${rawRows.length} rows from ${selectedFile.name}`,
        `Excluded ${rawRows.length - finalRecords.length} records based on import rules`,
        `Successfully integrated ${finalRecords.length} active service records into MIS`,
      ],
      columnMappingUsed: columnMapping,
    };

    setImportedBatch(batch);
    onImportComplete(batch, finalRecords);
    setStep(4);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setRawRows([]);
    setParsedHeaders([]);
    setColumnMapping({});
    setTransformResult(null);
    setStep(1);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Workflow Progress Steps */}
      <div className="bg-white border-2 border-[#171717] shadow-[3px_3px_0px_#171717] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-black uppercase text-[#171717]">
          <span>Import Pipeline:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-bold uppercase text-[11px]">
          <span
            className={`px-2.5 py-1 border-2 border-[#171717] ${
              step === 1 ? 'bg-[#F5E642] text-[#171717] shadow-[2px_2px_0px_#171717]' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            1. Select File
          </span>
          <span>→</span>
          <span
            className={`px-2.5 py-1 border-2 border-[#171717] ${
              step === 2 ? 'bg-[#F5E642] text-[#171717] shadow-[2px_2px_0px_#171717]' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            2. Preview & Map Columns
          </span>
          <span>→</span>
          <span
            className={`px-2.5 py-1 border-2 border-[#171717] ${
              step === 3 ? 'bg-[#F5E642] text-[#171717] shadow-[2px_2px_0px_#171717]' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            3. Validate & Resolve
          </span>
          <span>→</span>
          <span
            className={`px-2.5 py-1 border-2 border-[#171717] ${
              step === 4 ? 'bg-[#5278FF] text-white shadow-[2px_2px_0px_#171717]' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            4. Import Confirmed
          </span>
        </div>
      </div>

      {/* STEP 1: FILE SELECT & DRAG DROP */}
      {step === 1 && (
        <div className="space-y-6">
          <NeoCard variant="white" className="p-8 text-center" shadowSize="md">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-3 border-dashed border-[#171717] bg-[#FAF9F5] hover:bg-[#F5E642]/10 p-10 transition-colors cursor-pointer"
            >
              <div className="w-16 h-16 bg-[#F5E642] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="w-8 h-8 text-[#171717]" />
              </div>

              <h2 className="text-lg font-black uppercase tracking-tight text-[#171717]">
                Drag & Drop VETport Excel or CSV File
              </h2>
              <p className="text-xs font-semibold text-neutral-600 mt-1 max-w-md mx-auto">
                Supports .xlsx, .xls, and .csv files. Handles 12 standard VETport columns, trailing spaces, and non-breaking spaces automatically.
              </p>

              <div className="mt-6 flex justify-center">
                <NeoButton variant="primary" size="md" type="button">
                  Browse Files on Computer
                </NeoButton>
              </div>
            </div>

            {isLoading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[#171717]">
                <RefreshCw className="w-4 h-4 animate-spin text-[#171717]" />
                Parsing spreadsheet records...
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-100 border-2 border-red-600 text-red-900 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </NeoCard>

          {/* Report Type & Template Download info box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NeoCard variant="white" className="p-4" shadowSize="sm">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-[#171717] mb-3">
                <FileSpreadsheet className="w-4 h-4 text-[#171717]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#171717]">
                  Report Type Classification
                </h3>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-neutral-700">Select Source Schema:</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-[#F7F5EF] border-2 border-[#171717] p-2 text-xs font-bold"
                >
                  <option value="VETport Sales Report">VETport Sales Report (12 Standard Columns)</option>
                  <option value="VETport Clinic Billing Line Items">VETport Clinic Billing Line Items</option>
                  <option value="Other Service Billing Export">Other Service Billing Export</option>
                </select>
                <p className="text-[11px] text-neutral-500">
                  Maps all billed line items to the standard MIS schema with strict revenue calculations.
                </p>
              </div>
            </NeoCard>

            <NeoCard variant="white" className="p-4" shadowSize="sm">
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#171717] mb-3">
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-[#171717]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#171717]">
                    Standard VETport Templates
                  </h3>
                </div>
              </div>
              <p className="text-xs text-neutral-600 mb-3">
                Need to format your data? Download the official 12-column template with sample records.
              </p>
              <div className="flex gap-2">
                <NeoButton
                  variant="secondary"
                  size="sm"
                  onClick={() => downloadVETportTemplate('xlsx')}
                >
                  Download .xlsx
                </NeoButton>
                <NeoButton
                  variant="secondary"
                  size="sm"
                  onClick={() => downloadVETportTemplate('csv')}
                >
                  Download .csv
                </NeoButton>
              </div>
            </NeoCard>
          </div>
        </div>
      )}

      {/* STEP 2: RAW DATA PREVIEW & COLUMN MAPPING */}
      {step === 2 && (
        <div className="space-y-6">
          <NeoCard variant="white" className="p-5" shadowSize="md">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b-2 border-[#171717] mb-4 gap-2">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-[#171717]">
                  Column Mapping & Source Verification
                </h2>
                <p className="text-[11px] text-neutral-500">
                  File: <span className="font-mono font-bold text-[#171717]">{selectedFile?.name}</span> ({rawRows.length} source rows detected)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <NeoButton variant="secondary" size="sm" onClick={resetUpload}>
                  Cancel / New File
                </NeoButton>
                <NeoButton variant="primary" size="sm" onClick={handleProceedToValidation}>
                  Proceed to Validation →
                </NeoButton>
              </div>
            </div>

            {/* Column Mapping Grid */}
            <div className="bg-[#FAF9F5] p-4 border-2 border-[#171717] mb-6">
              <div className="text-xs font-black uppercase text-[#171717] mb-3 flex items-center justify-between">
                <span>The 12 Authoritative VETport Source Columns</span>
                <span className="text-[11px] font-mono text-neutral-500">
                  Auto-mapped: {Object.keys(columnMapping).length} / 12 fields
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {MIS_STANDARD_FIELDS.map((field) => {
                  const mappedTo = columnMapping[field.key] || '';
                  const isMapped = Boolean(mappedTo);

                  return (
                    <div
                      key={field.key}
                      className={`p-2.5 border-2 ${
                        isMapped ? 'border-[#171717] bg-white' : 'border-amber-400 bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#171717]">
                          {field.label} {field.required && <span className="text-red-600">*</span>}
                        </span>
                        {isMapped ? (
                          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1 border border-green-300">
                            Mapped
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 border border-amber-300">
                            Unassigned
                          </span>
                        )}
                      </div>

                      <select
                        value={mappedTo}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="w-full bg-[#F7F5EF] border border-[#171717] text-xs font-medium p-1 focus:bg-[#F5E642]"
                      >
                        <option value="">-- Select Source Column --</option>
                        {parsedHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-neutral-500 mt-1 truncate">{field.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Raw Data Preview Table (First 5 Rows) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-[#171717]">
                  Raw File Preview (First 5 Rows)
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  Showing raw values as received
                </span>
              </div>

              <div className="overflow-x-auto border-2 border-[#171717]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#F5E642] text-[#171717] uppercase font-black text-[11px] border-b-2 border-[#171717]">
                    <tr>
                      <th className="p-2 border-r border-[#171717]">#</th>
                      {parsedHeaders.map((h) => (
                        <th key={h} className="p-2 border-r border-[#171717] whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b border-neutral-300 bg-white hover:bg-[#F7F5EF]">
                        <td className="p-2 font-mono font-bold border-r border-neutral-300">{idx + 1}</td>
                        {parsedHeaders.map((h) => (
                          <td key={h} className="p-2 font-mono border-r border-neutral-300 whitespace-nowrap">
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </NeoCard>
        </div>
      )}

      {/* STEP 3: VALIDATION RESULTS & DUPLICATE ANALYSIS */}
      {step === 3 && transformResult && (
        <div className="space-y-6">
          <NeoCard variant="white" className="p-5" shadowSize="md">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b-2 border-[#171717] mb-4 gap-2">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-[#171717]">
                  Validation & Duplicate Audit
                </h2>
                <p className="text-[11px] text-neutral-500">
                  Review calculated billed revenue, warnings, and potential duplicate service lines
                </p>
              </div>

              <div className="flex items-center gap-2">
                <NeoButton variant="secondary" size="sm" onClick={() => setStep(2)}>
                  ← Back to Mappings
                </NeoButton>
                <NeoButton variant="primary" size="sm" onClick={handleConfirmImport}>
                  Confirm & Integrate Records →
                </NeoButton>
              </div>
            </div>

            {/* Validation Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="border-2 border-[#171717] p-3 bg-[#f3faf4]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-800 uppercase">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Valid Records
                </div>
                <div className="text-2xl font-black font-mono text-green-900 mt-1 tabular-nums">
                  {transformResult.validCount}
                </div>
              </div>

              <div className="border-2 border-[#171717] p-3 bg-[#fffdf0]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Warnings (Notes)
                </div>
                <div className="text-2xl font-black font-mono text-amber-900 mt-1 tabular-nums">
                  {transformResult.warningCount}
                </div>
              </div>

              <div className="border-2 border-[#171717] p-3 bg-[#fff5f5]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 uppercase">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Rejected / Errors
                </div>
                <div className="text-2xl font-black font-mono text-red-900 mt-1 tabular-nums">
                  {transformResult.errorCount}
                </div>
              </div>

              <div className="border-2 border-[#171717] p-3 bg-[#f5f8ff]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 uppercase">
                  <Copy className="w-4 h-4 text-blue-600" />
                  Duplicate Lines
                </div>
                <div className="text-2xl font-black font-mono text-blue-900 mt-1 tabular-nums">
                  {transformResult.potentialDuplicateCount}
                </div>
              </div>
            </div>

            {/* Import Controls & Duplicate Rules */}
            <div className="p-4 bg-[#FAF9F5] border-2 border-[#171717] mb-6 space-y-3 text-xs">
              <span className="font-black uppercase text-[#171717] block">
                Record Exclusion & Duplicate Handling Rules
              </span>

              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={excludeDuplicates}
                  onChange={(e) => setExcludeDuplicates(e.target.checked)}
                  className="w-4 h-4 accent-[#171717]"
                />
                <span>
                  Exclude potential duplicate service lines ({transformResult.potentialDuplicateCount} flagged)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={excludeErrors}
                  onChange={(e) => setExcludeErrors(e.target.checked)}
                  className="w-4 h-4 accent-[#171717]"
                />
                <span>
                  Exclude records with fatal errors ({transformResult.errorCount} unparseable lines)
                </span>
              </label>

              <div className="text-[11px] text-neutral-600 pt-2 border-t border-neutral-300">
                <strong>Duplicate Logic:</strong> Same Invoice No + Item Name + Provider + Billed Amount + Patient ID is treated as a duplicate service line. Distinct items on the same invoice are preserved.
              </div>
            </div>

            {/* Transformed Records Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-[#171717]">
                  Standardized MIS Preview (First 8 Records)
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  Verify billed revenue calculation
                </span>
              </div>

              <div className="overflow-x-auto border-2 border-[#171717]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#171717] text-white uppercase font-black text-[11px]">
                    <tr>
                      <th className="p-2 border-r border-neutral-700">Status</th>
                      <th className="p-2 border-r border-neutral-700">Invoice #</th>
                      <th className="p-2 border-r border-neutral-700">Date</th>
                      <th className="p-2 border-r border-neutral-700">Patient</th>
                      <th className="p-2 border-r border-neutral-700">Service Plan Item</th>
                      <th className="p-2 border-r border-neutral-700 text-right">Qty</th>
                      <th className="p-2 border-r border-neutral-700 text-right">Billed Amount</th>
                      <th className="p-2 border-r border-neutral-700">Category</th>
                      <th className="p-2 border-r border-neutral-700">Provider</th>
                      <th className="p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transformResult.records.slice(0, 8).map((r, i) => (
                      <tr
                        key={i}
                        className={`border-b border-neutral-300 ${
                          r.isPotentialDuplicate
                            ? 'bg-blue-50'
                            : r.validationStatus === 'Error'
                            ? 'bg-red-50'
                            : r.validationStatus === 'Warning'
                            ? 'bg-yellow-50/50'
                            : 'bg-white'
                        }`}
                      >
                        <td className="p-2 font-mono font-bold border-r border-neutral-300">
                          {r.validationStatus === 'Valid' && (
                            <span className="text-green-700">VALID</span>
                          )}
                          {r.validationStatus === 'Warning' && (
                            <span className="text-amber-700">WARNING</span>
                          )}
                          {r.validationStatus === 'Error' && (
                            <span className="text-red-700">ERROR</span>
                          )}
                        </td>
                        <td className="p-2 font-mono font-bold border-r border-neutral-300">{r.invoiceNo}</td>
                        <td className="p-2 font-mono border-r border-neutral-300">{r.invoiceDate}</td>
                        <td className="p-2 font-medium border-r border-neutral-300">{r.patientName}</td>
                        <td className="p-2 font-medium border-r border-neutral-300">{r.planItem}</td>
                        <td className="p-2 font-mono text-right border-r border-neutral-300">{r.quantity}</td>
                        <td className="p-2 font-mono font-black text-right border-r border-neutral-300 text-[#171717]">
                          {formatINR(r.billedAmount)}
                        </td>
                        <td className="p-2 border-r border-neutral-300">
                          {r.serviceCategory}
                          {r.needsCategoryReview && (
                            <span className="ml-1 text-[9px] bg-[#FF715B] text-white px-1">Review</span>
                          )}
                        </td>
                        <td className="p-2 border-r border-neutral-300">{r.provider}</td>
                        <td className="p-2 text-[10px] text-neutral-600 font-mono">
                          {r.notes.join(', ') || 'OK'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </NeoCard>
        </div>
      )}

      {/* STEP 4: IMPORT CONFIRMED */}
      {step === 4 && importedBatch && (
        <NeoCard variant="white" className="p-8 text-center" shadowSize="lg">
          <div className="w-16 h-16 bg-[#F5E642] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#171717]" />
          </div>

          <h2 className="text-xl font-black uppercase tracking-tight text-[#171717]">
            VETport Data Successfully Integrated
          </h2>
          <p className="text-xs font-semibold text-neutral-600 mt-1 max-w-md mx-auto">
            Batch ID: <span className="font-mono text-[#171717]">{importedBatch.id}</span>
          </p>

          <div className="my-6 max-w-lg mx-auto bg-[#FAF9F5] border-2 border-[#171717] p-4 text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-neutral-200 pb-1">
              <span className="text-neutral-600">File Name:</span>
              <span className="font-mono font-bold text-[#171717]">{importedBatch.fileName}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-1">
              <span className="text-neutral-600">Source Rows:</span>
              <span className="font-mono font-bold text-[#171717]">{importedBatch.sourceRowCount}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-1">
              <span className="text-neutral-600">Validated Records:</span>
              <span className="font-mono font-bold text-green-700">{importedBatch.validCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Potential Duplicates Identified:</span>
              <span className="font-mono font-bold text-blue-700">{importedBatch.potentialDuplicateCount}</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <NeoButton variant="secondary" size="md" onClick={resetUpload}>
              Upload Another File
            </NeoButton>
            <NeoButton
              variant="accent"
              size="md"
              onClick={() => {
                if (transformResult) {
                  exportRecordsToExcel(transformResult.records, `MIS_${importedBatch.fileName}.xlsx`);
                }
              }}
            >
              <FileDown className="w-4 h-4" />
              Download Standardized MIS (.xlsx)
            </NeoButton>
          </div>
        </NeoCard>
      )}
    </div>
  );
};
