import React from 'react';
import { FilterState, StandardMISRecord } from '../../types';
import { RotateCcw, Filter, Calendar, MapPin, User, Tag } from 'lucide-react';

interface FiltersBarProps {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onClear: () => void;
  records: StandardMISRecord[];
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onChange,
  onClear,
  records,
}) => {
  // Extract unique branches
  const branches = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.branch && r.branch.trim()) set.add(r.branch.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Extract unique providers
  const providers = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.provider && r.provider.trim()) set.add(r.provider.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Extract unique categories
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.serviceCategory && r.serviceCategory.trim()) set.add(r.serviceCategory.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  const hasActiveFilters =
    filters.period !== 'all' ||
    filters.branch !== 'all' ||
    filters.provider !== 'all' ||
    filters.category !== 'all' ||
    Boolean(filters.searchQuery);

  return (
    <div className="bg-white border-2 border-[#171717] shadow-[4px_4px_0px_#171717] p-3 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b-2 border-[#171717] mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-[#171717] text-white p-1">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-[#171717]">
            Global MIS Dropdown Filters
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            (Filtered against {records.length} total imported service lines)
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-300 cursor-pointer uppercase transition-all"
            title="Reset all filters to defaults"
          >
            <RotateCcw className="w-3 h-3" />
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Date Range Filter */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
            <Calendar className="w-3 h-3 text-[#171717]" />
            Invoice Date Range
          </label>
          <select
            value={filters.period}
            onChange={(e) => onChange({ period: e.target.value })}
            className="w-full bg-[#F7F5EF] border-2 border-[#171717] px-2.5 py-1.5 text-xs font-semibold text-[#171717] focus:outline-none focus:bg-[#F5E642]"
          >
            <option value="all">All Available Dates</option>
            <option value="fy26-td">1 April 2026 to October 2026 (FYTD)</option>
            <option value="cur-month">Current Month (October 2026)</option>
            <option value="prev-month">Previous Month (September 2026)</option>
            <option value="custom">Custom Date Range...</option>
          </select>
        </div>

        {/* Branch Filter */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
            <MapPin className="w-3 h-3 text-[#171717]" />
            Hospital Branch
          </label>
          <select
            value={filters.branch}
            onChange={(e) => onChange({ branch: e.target.value })}
            className="w-full bg-[#F7F5EF] border-2 border-[#171717] px-2.5 py-1.5 text-xs font-semibold text-[#171717] focus:outline-none focus:bg-[#F5E642]"
          >
            <option value="all">All Branches ({branches.length})</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Provider Filter */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
            <User className="w-3 h-3 text-[#171717]" />
            Performed Staff / Provider
          </label>
          <select
            value={filters.provider}
            onChange={(e) => onChange({ provider: e.target.value })}
            className="w-full bg-[#F7F5EF] border-2 border-[#171717] px-2.5 py-1.5 text-xs font-semibold text-[#171717] focus:outline-none focus:bg-[#F5E642]"
          >
            <option value="all">All Staff ({providers.length})</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Service Category Filter */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
            <Tag className="w-3 h-3 text-[#171717]" />
            Service Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className="w-full bg-[#F7F5EF] border-2 border-[#171717] px-2.5 py-1.5 text-xs font-semibold text-[#171717] focus:outline-none focus:bg-[#F5E642]"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Date Inputs if Custom is selected */}
      {filters.period === 'custom' && (
        <div className="mt-3 pt-3 border-t border-dashed border-neutral-300 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase text-neutral-600">Select Range:</span>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium">From:</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onChange({ startDate: e.target.value })}
              className="bg-[#F7F5EF] border border-[#171717] px-2 py-1 text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium">To:</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className="bg-[#F7F5EF] border border-[#171717] px-2 py-1 text-xs font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
};
