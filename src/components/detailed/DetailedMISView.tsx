import React, { useState, useMemo } from 'react';
import { StandardMISRecord } from '../../types';
import { formatINR } from '../../utils/currency';
import { exportRecordsToCSV, exportRecordsToExcel } from '../../utils/exporter';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import {
  Search,
  ArrowUpDown,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';

interface DetailedMISViewProps {
  records: StandardMISRecord[];
}

export const DetailedMISView: React.FC<DetailedMISViewProps> = ({ records }) => {
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Valid' | 'Warning' | 'Error' | 'duplicates' | 'needs-review'>('all');
  const [sortField, setSortField] = useState<keyof StandardMISRecord>('invoiceDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedRecord, setSelectedRecord] = useState<StandardMISRecord | null>(null);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Status filter
      if (statusFilter === 'Valid' && r.validationStatus !== 'Valid') return false;
      if (statusFilter === 'Warning' && r.validationStatus !== 'Warning') return false;
      if (statusFilter === 'Error' && r.validationStatus !== 'Error') return false;
      if (statusFilter === 'duplicates' && !r.isPotentialDuplicate) return false;
      if (statusFilter === 'needs-review' && !r.needsCategoryReview) return false;

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesClient = r.clientName.toLowerCase().includes(query) || r.clientId.toLowerCase().includes(query);
        const matchesPatient = r.patientName.toLowerCase().includes(query) || r.patientId.toLowerCase().includes(query);
        const matchesInvoice = r.invoiceNo.toLowerCase().includes(query);
        const matchesItem = r.planItem.toLowerCase().includes(query);
        const matchesProvider = r.provider.toLowerCase().includes(query);
        const matchesBranch = r.branch.toLowerCase().includes(query);
        const matchesCat = r.serviceCategory.toLowerCase().includes(query);

        if (!matchesClient && !matchesPatient && !matchesInvoice && !matchesItem && !matchesProvider && !matchesBranch && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [records, statusFilter, searchTerm]);

  // Sort records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredRecords, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleSort = (field: keyof StandardMISRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const totalFilteredRevenue = useMemo(() => {
    return filteredRecords.reduce((sum, r) => {
      if (r.validationStatus !== 'Error' && typeof r.billedAmount === 'number' && !isNaN(r.billedAmount)) {
        return sum + r.billedAmount;
      }
      return sum;
    }, 0);
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Search Bar */}
      <NeoCard variant="white" className="p-4" shadowSize="md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-[#171717]">
          {/* Search box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Client, Patient, Invoice #, Plan Item, Provider, Branch..."
              className="w-full bg-[#F7F5EF] border-2 border-[#171717] pl-9 pr-3 py-1.5 text-xs font-semibold focus:outline-none focus:bg-[#F5E642]"
            />
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="text-[10px] uppercase text-neutral-500 mr-1">Filter by Status:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'Valid', label: 'Valid' },
              { id: 'Warning', label: 'Warnings' },
              { id: 'Error', label: 'Errors' },
              { id: 'duplicates', label: 'Duplicates' },
              { id: 'needs-review', label: 'Needs Review' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 uppercase text-[11px] border-2 transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#171717] text-white border-[#171717]'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#171717]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <NeoButton
              variant="secondary"
              size="sm"
              onClick={() => exportRecordsToExcel(filteredRecords, 'Detailed_MIS_Export.xlsx')}
              title="Export visible records to Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              Excel (.xlsx)
            </NeoButton>
            <NeoButton
              variant="secondary"
              size="sm"
              onClick={() => exportRecordsToCSV(filteredRecords, 'Detailed_MIS_Export.csv')}
              title="Export visible records to CSV"
            >
              CSV
            </NeoButton>
          </div>
        </div>

        {/* Filter Summary Banner */}
        <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-neutral-600 gap-2 font-mono">
          <div>
            Showing <strong className="text-[#171717]">{filteredRecords.length}</strong> of{' '}
            <strong>{records.length}</strong> service lines
          </div>
          <div className="font-bold text-[#171717]">
            Filtered Revenue Subtotal:{' '}
            <span className="text-base text-black bg-[#F5E642] px-2 py-0.5 border border-[#171717]">
              {formatINR(totalFilteredRevenue)}
            </span>
          </div>
        </div>
      </NeoCard>

      {/* Main High-Density MIS Data Grid */}
      <NeoCard variant="white" className="p-0 overflow-hidden" shadowSize="md">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-xs text-left border-collapse min-w-[1200px]">
            {/* Table Header */}
            <thead className="bg-[#F5E642] text-[#171717] uppercase font-black text-[11px] sticky top-0 z-10 border-b-2 border-[#171717]">
              <tr>
                <th className="p-2.5 border-r border-[#171717] w-12 text-center">#</th>
                <th className="p-2.5 border-r border-[#171717] w-28">Status</th>
                <th
                  onClick={() => handleSort('invoiceNo')}
                  className="p-2.5 border-r border-[#171717] cursor-pointer hover:bg-yellow-300 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Invoice #</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('invoiceDate')}
                  className="p-2.5 border-r border-[#171717] cursor-pointer hover:bg-yellow-300 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Invoice Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('clientName')}
                  className="p-2.5 border-r border-[#171717] cursor-pointer hover:bg-yellow-300 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Client Name (ID)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('patientName')}
                  className="p-2.5 border-r border-[#171717] cursor-pointer hover:bg-yellow-300 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Patient Name (ID)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('planItem')}
                  className="p-2.5 border-r border-[#171717] cursor-pointer hover:bg-yellow-300 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Plan Item Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="p-2.5 border-r border-[#171717] text-right cursor-pointer hover:bg-yellow-300 select-none w-16"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Qty</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('billedAmount')}
                  className="p-2.5 border-r border-[#171717] text-right cursor-pointer hover:bg-yellow-300 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Billed Amount (₹)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('serviceCategory')}
                  className="p-2.5 border-r border-[#171717] cursor-pointer hover:bg-yellow-300 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('provider')}
                  className="p-2.5 border-r border-[#171717] cursor-pointer hover:bg-yellow-300 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Performed Staff</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('branch')}
                  className="p-2.5 border-r border-[#171717] cursor-pointer hover:bg-yellow-300 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Branch</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-2.5 w-16 text-center">Action</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {paginatedRecords.map((r, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                const isError = r.validationStatus === 'Error';
                const isDup = r.isPotentialDuplicate;
                const isZero = r.billedAmount === 0;

                return (
                  <tr
                    key={r.id}
                    className={`border-b border-neutral-300 transition-colors ${
                      isError
                        ? 'bg-red-50 hover:bg-red-100'
                        : isDup
                        ? 'bg-blue-50/70 hover:bg-blue-100/70'
                        : isZero
                        ? 'bg-neutral-50 hover:bg-neutral-100'
                        : 'bg-white hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <td className="p-2 text-center font-mono font-bold border-r border-neutral-300 text-neutral-500">
                      {globalIndex}
                    </td>

                    {/* Status Badge */}
                    <td className="p-2 border-r border-neutral-300 whitespace-nowrap">
                      {r.validationStatus === 'Valid' && !isDup && !r.needsCategoryReview && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 border border-green-300 uppercase">
                          <CheckCircle2 className="w-3 h-3" /> Valid
                        </span>
                      )}
                      {r.validationStatus === 'Warning' && !isDup && !r.needsCategoryReview && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 border border-amber-300 uppercase">
                          <AlertTriangle className="w-3 h-3" /> Warning
                        </span>
                      )}
                      {r.validationStatus === 'Error' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 border border-red-300 uppercase">
                          <XCircle className="w-3 h-3" /> Error
                        </span>
                      )}
                      {isDup && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 border border-blue-300 uppercase">
                          <Copy className="w-3 h-3" /> Duplicate
                        </span>
                      )}
                      {r.needsCategoryReview && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF715B] bg-orange-100 px-1.5 py-0.5 border border-orange-300 uppercase">
                          Review
                        </span>
                      )}
                    </td>

                    {/* Invoice No (preserve leading zeros) */}
                    <td className="p-2 font-mono font-bold border-r border-neutral-300 text-[#171717]">
                      {r.invoiceNo || <span className="text-red-500 italic">Missing</span>}
                    </td>

                    {/* Invoice Date */}
                    <td className="p-2 font-mono border-r border-neutral-300 whitespace-nowrap">
                      {r.invoiceDate === 'Missing Date' ? (
                        <span className="text-red-600 font-bold">Missing Date</span>
                      ) : (
                        r.invoiceDate
                      )}
                    </td>

                    {/* Client Name & ID */}
                    <td className="p-2 border-r border-neutral-300">
                      <div className="font-bold text-[#171717]">{r.clientName}</div>
                      <div className="font-mono text-[10px] text-neutral-500">ID: {r.clientId}</div>
                    </td>

                    {/* Patient Name & ID */}
                    <td className="p-2 border-r border-neutral-300">
                      <div className="font-bold text-[#171717]">{r.patientName}</div>
                      <div className="font-mono text-[10px] text-neutral-500">ID: {r.patientId}</div>
                    </td>

                    {/* Plan Item */}
                    <td className="p-2 font-medium border-r border-neutral-300 max-w-[200px] truncate" title={r.planItem}>
                      {r.planItem}
                    </td>

                    {/* Qty */}
                    <td className="p-2 font-mono text-right border-r border-neutral-300">
                      {r.quantity}
                    </td>

                    {/* Billed Amount (NEVER MULTIPLIED BY QUANTITY) */}
                    <td className="p-2 font-mono font-black text-right border-r border-neutral-300 tabular-nums text-[#171717]">
                      {isError ? (
                        <span className="text-red-600">Invalid</span>
                      ) : (
                        formatINR(r.billedAmount)
                      )}
                    </td>

                    {/* Category */}
                    <td className="p-2 border-r border-neutral-300">
                      <span className="font-semibold">{r.serviceCategory}</span>
                      {r.needsCategoryReview && (
                        <div className="text-[10px] text-[#FF715B] font-mono">Raw: {r.rawCategory}</div>
                      )}
                    </td>

                    {/* Provider */}
                    <td className="p-2 border-r border-neutral-300 truncate max-w-[150px]">
                      {r.provider}
                    </td>

                    {/* Branch */}
                    <td className="p-2 border-r border-neutral-300">
                      {r.branch}
                    </td>

                    {/* Action */}
                    <td className="p-2 text-center">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-200 border border-neutral-300 cursor-pointer"
                        title="Inspect Record Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-xs text-neutral-500 font-mono">
                    No service line records found matching active search and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Controls Bar */}
        <div className="p-3 bg-[#FAF9F5] border-t-2 border-[#171717] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-600 font-bold uppercase text-[10px]">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-[#171717] px-2 py-1 text-xs font-mono font-bold"
            >
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-neutral-600">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1 border border-[#171717] bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F5E642] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1 border border-[#171717] bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F5E642] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </NeoCard>

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-[#171717]/60 z-50 flex items-center justify-center p-4">
          <NeoCard variant="white" className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" shadowSize="lg">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
              <div>
                <h3 className="text-sm font-black uppercase text-[#171717]">
                  Service Line Record Inspector
                </h3>
                <p className="text-[11px] font-mono text-neutral-500">
                  ID: {selectedRecord.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-2 py-1 bg-neutral-200 hover:bg-neutral-300 font-bold text-xs cursor-pointer border border-[#171717]"
              >
                Close (ESC)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="border p-2 bg-[#FAF9F5]">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Invoice Number</span>
                <span className="font-mono font-bold text-sm">{selectedRecord.invoiceNo}</span>
              </div>
              <div className="border p-2 bg-[#FAF9F5]">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Invoice Date</span>
                <span className="font-mono font-bold text-sm">{selectedRecord.invoiceDate}</span>
              </div>
              <div className="border p-2 bg-[#FAF9F5]">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Client Name & ID</span>
                <span className="font-bold">{selectedRecord.clientName} ({selectedRecord.clientId})</span>
              </div>
              <div className="border p-2 bg-[#FAF9F5]">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Patient Name & ID</span>
                <span className="font-bold">{selectedRecord.patientName} ({selectedRecord.patientId})</span>
              </div>
              <div className="border p-2 bg-[#FAF9F5] col-span-2">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Plan Item Name</span>
                <span className="font-bold">{selectedRecord.planItem}</span>
              </div>
              <div className="border p-2 bg-[#FAF9F5]">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Quantity Delivered</span>
                <span className="font-mono font-bold">{selectedRecord.quantity}</span>
              </div>
              <div className="border p-2 bg-[#F5E642] border-[#171717]">
                <span className="text-[10px] text-[#171717] uppercase block font-black">Billed Amount (Revenue)</span>
                <span className="font-mono font-black text-base">{formatINR(selectedRecord.billedAmount)}</span>
                <span className="text-[9px] block text-neutral-700">Line total as invoiced; not multiplied</span>
              </div>
              <div className="border p-2 bg-[#FAF9F5]">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Standard Category</span>
                <span className="font-bold">{selectedRecord.serviceCategory}</span>
              </div>
              <div className="border p-2 bg-[#FAF9F5]">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Raw Source Category</span>
                <span className="font-mono">{selectedRecord.rawCategory}</span>
              </div>
              <div className="border p-2 bg-[#FAF9F5]">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Performed Staff</span>
                <span className="font-bold">{selectedRecord.provider}</span>
              </div>
              <div className="border p-2 bg-[#FAF9F5]">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Hospital Branch</span>
                <span className="font-bold">{selectedRecord.branch}</span>
              </div>
            </div>

            {selectedRecord.notes.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-300 text-xs">
                <div className="font-bold uppercase text-amber-900 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Validation Notes & Flags:
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-800 font-mono text-[11px]">
                  {selectedRecord.notes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </NeoCard>
        </div>
      )}
    </div>
  );
};
