import React, { useState } from 'react';
import { ImportBatch, StandardMISRecord } from '../../types';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import {
  History,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Trash2,
  Info,
  Calendar,
} from 'lucide-react';
import { formatReadableDate } from '../../utils/date';

interface ImportHistoryViewProps {
  batches: ImportBatch[];
  records: StandardMISRecord[];
  onRemoveBatch?: (batchId: string) => void;
}

export const ImportHistoryView: React.FC<ImportHistoryViewProps> = ({
  batches,
  records,
  onRemoveBatch,
}) => {
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);

  return (
    <div className="space-y-6">
      {/* Scope Disclaimer Banner */}
      <div className="bg-[#FAF9F5] border-2 border-[#171717] p-3 text-xs flex items-center justify-between gap-3 text-neutral-700">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#171717] shrink-0" />
          <span>
            <strong>Audit Trail & Session Scope:</strong> Import history logs are maintained in browser session and persistent local storage. Ingestion runs are audited for duplicate records and column mappings.
          </span>
        </div>
        <span className="font-mono font-bold text-[11px] bg-[#F5E642] px-2 py-0.5 border border-[#171717]">
          {batches.length} Batches Logged
        </span>
      </div>

      {/* Batches Table */}
      <NeoCard variant="white" className="p-5" shadowSize="md">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-[#171717] flex items-center gap-2">
              <History className="w-4 h-4 text-[#171717]" />
              Historical Ingestion Batches
            </h2>
            <p className="text-[11px] text-neutral-500">
              Complete audit ledger of uploaded spreadsheets and validation diagnostics
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[900px]">
            <thead className="bg-[#171717] text-white uppercase font-black text-[10px]">
              <tr>
                <th className="p-2 border-r border-neutral-700">Batch ID</th>
                <th className="p-2 border-r border-neutral-700">File Name</th>
                <th className="p-2 border-r border-neutral-700">Imported At</th>
                <th className="p-2 border-r border-neutral-700">Report Type</th>
                <th className="p-2 border-r border-neutral-700 text-right">Source Rows</th>
                <th className="p-2 border-r border-neutral-700 text-right">Valid</th>
                <th className="p-2 border-r border-neutral-700 text-right">Warnings</th>
                <th className="p-2 border-r border-neutral-700 text-right">Duplicates</th>
                <th className="p-2 border-r border-neutral-700 text-right">Rejected</th>
                <th className="p-2 border-r border-neutral-700">Status</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr
                  key={batch.id}
                  className="border-b border-neutral-300 bg-white hover:bg-[#FAF9F5] transition-colors"
                >
                  <td className="p-2 font-mono font-bold border-r border-neutral-300 text-neutral-600">
                    {batch.id.slice(0, 14)}...
                  </td>
                  <td className="p-2 font-bold text-[#171717] border-r border-neutral-300">
                    <div className="flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#171717]" />
                      <span>{batch.fileName}</span>
                    </div>
                  </td>
                  <td className="p-2 font-mono border-r border-neutral-300 whitespace-nowrap text-neutral-600">
                    {new Date(batch.importedAt).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="p-2 border-r border-neutral-300 text-neutral-700">
                    {batch.reportType}
                  </td>
                  <td className="p-2 font-mono text-right font-bold text-[#171717] border-r border-neutral-300">
                    {batch.sourceRowCount}
                  </td>
                  <td className="p-2 font-mono text-right text-green-700 font-bold border-r border-neutral-300">
                    {batch.validCount}
                  </td>
                  <td className="p-2 font-mono text-right text-amber-700 font-bold border-r border-neutral-300">
                    {batch.warningCount}
                  </td>
                  <td className="p-2 font-mono text-right text-blue-700 font-bold border-r border-neutral-300">
                    {batch.potentialDuplicateCount}
                  </td>
                  <td className="p-2 font-mono text-right text-red-700 font-bold border-r border-neutral-300">
                    {batch.rejectedCount}
                  </td>
                  <td className="p-2 border-r border-neutral-300">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase border ${
                        batch.status === 'Completed'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </td>
                  <td className="p-2 text-center space-x-1">
                    <button
                      onClick={() => setSelectedBatch(batch)}
                      className="px-2 py-1 bg-neutral-100 hover:bg-[#F5E642] text-[10px] font-bold uppercase border border-[#171717] cursor-pointer"
                    >
                      Audit
                    </button>
                    {onRemoveBatch && batches.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove batch "${batch.fileName}" and its associated records?`)) {
                            onRemoveBatch(batch.id);
                          }
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 border border-red-300 cursor-pointer"
                        title="Remove batch"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </NeoCard>

      {/* Batch Audit Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-[#171717]/60 z-50 flex items-center justify-center p-4">
          <NeoCard variant="white" className="max-w-xl w-full p-6 max-h-[85vh] overflow-y-auto" shadowSize="lg">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
              <div>
                <h3 className="text-sm font-black uppercase text-[#171717]">
                  Batch Ingestion Audit Log
                </h3>
                <p className="text-[11px] font-mono text-neutral-500">
                  {selectedBatch.fileName}
                </p>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="px-2 py-1 bg-neutral-200 hover:bg-neutral-300 font-bold text-xs cursor-pointer border border-[#171717]"
              >
                Close (ESC)
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#FAF9F5] p-3 border border-[#171717]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Timestamp</span>
                  <span className="font-mono">{new Date(selectedBatch.importedAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">File Type</span>
                  <span className="font-mono uppercase font-bold">{selectedBatch.fileType}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Source Rows</span>
                  <span className="font-mono font-bold">{selectedBatch.sourceRowCount}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Valid Ratio</span>
                  <span className="font-mono font-bold text-green-700">
                    {selectedBatch.validCount} / {selectedBatch.sourceRowCount} (
                    {((selectedBatch.validCount / Math.max(1, selectedBatch.sourceRowCount)) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              {selectedBatch.summaryNotes && selectedBatch.summaryNotes.length > 0 && (
                <div>
                  <span className="font-bold uppercase text-[11px] block mb-1">
                    System Processing Notes:
                  </span>
                  <ul className="list-disc pl-4 space-y-1 font-mono text-[11px] text-neutral-700 bg-neutral-50 p-2 border">
                    {selectedBatch.summaryNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <span className="font-bold uppercase text-[11px] block mb-1">
                  Source-to-MIS Column Mappings Applied:
                </span>
                <div className="border border-neutral-300 max-h-40 overflow-y-auto font-mono text-[11px]">
                  {Object.entries(selectedBatch.columnMappingUsed || {}).map(([misKey, srcH]) => (
                    <div key={misKey} className="flex justify-between p-1.5 border-b border-neutral-200">
                      <span className="font-bold">{misKey}:</span>
                      <span className="text-neutral-600 font-semibold">{srcH}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </NeoCard>
        </div>
      )}
    </div>
  );
};
