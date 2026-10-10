import React, { useState, useMemo } from 'react';
import { StandardMISRecord } from '../../types';
import { formatINR, formatINRCompact } from '../../utils/currency';
import { NeoCard } from '../common/NeoCard';
import { UserCheck, Trophy, Layers, Building, Calendar, Info, ArrowUpRight } from 'lucide-react';
import { formatMonthName } from '../../utils/date';

interface ProviderPerformanceViewProps {
  records: StandardMISRecord[];
}

export const ProviderPerformanceView: React.FC<ProviderPerformanceViewProps> = ({ records }) => {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Calculate Provider Stats
  const providerStats = useMemo(() => {
    const totalFilteredRev = records.reduce((sum, r) => {
      if (r.validationStatus !== 'Error' && typeof r.billedAmount === 'number' && !isNaN(r.billedAmount)) {
        return sum + r.billedAmount;
      }
      return sum;
    }, 0);

    const map = new Map<
      string,
      {
        name: string;
        revenue: number;
        recordCount: number;
        totalQty: number;
        categories: Map<string, number>;
        branches: Map<string, number>;
        months: Map<string, number>;
      }
    >();

    records.forEach((r) => {
      const pName = r.provider || 'Unassigned Staff';
      if (!map.has(pName)) {
        map.set(pName, {
          name: pName,
          revenue: 0,
          recordCount: 0,
          totalQty: 0,
          categories: new Map(),
          branches: new Map(),
          months: new Map(),
        });
      }

      const p = map.get(pName)!;
      if (r.validationStatus !== 'Error' && typeof r.billedAmount === 'number' && !isNaN(r.billedAmount)) {
        p.revenue += r.billedAmount;
      }
      p.recordCount += 1;
      p.totalQty += r.quantity || 0;

      // Category breakdown
      const cat = r.serviceCategory || 'Uncategorized';
      p.categories.set(cat, (p.categories.get(cat) || 0) + (r.validationStatus !== 'Error' ? r.billedAmount : 0));

      // Branch breakdown
      const br = r.branch || 'Unknown';
      p.branches.set(br, (p.branches.get(br) || 0) + (r.validationStatus !== 'Error' ? r.billedAmount : 0));

      // Month breakdown
      const m = r.month || 'Unknown';
      p.months.set(m, (p.months.get(m) || 0) + (r.validationStatus !== 'Error' ? r.billedAmount : 0));
    });

    const list = Array.from(map.values())
      .map((item) => ({
        ...item,
        avgBilled: item.recordCount > 0 ? item.revenue / item.recordCount : 0,
        revenueShare: totalFilteredRev > 0 ? (item.revenue / totalFilteredRev) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return { list, totalFilteredRev };
  }, [records]);

  // Set default selected provider if not set
  React.useEffect(() => {
    if (!selectedProvider && providerStats.list.length > 0) {
      setSelectedProvider(providerStats.list[0].name);
    }
  }, [providerStats.list, selectedProvider]);

  const activeProviderData = useMemo(() => {
    return providerStats.list.find((p) => p.name === selectedProvider) || providerStats.list[0] || null;
  }, [providerStats.list, selectedProvider]);

  const maxRevenue = providerStats.list.length > 0 ? providerStats.list[0].revenue : 1;

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="bg-[#FAF9F5] border-2 border-[#171717] p-3 text-xs flex items-center gap-2 text-neutral-700">
        <Info className="w-4 h-4 text-[#171717] shrink-0" />
        <span>
          <strong>Performed Staff Dimension:</strong> Derived strictly from the source "Performed Staff" field. Roles reflect raw data without assuming physician or clinical seniority unless recorded.
        </span>
      </div>

      {/* Main Ranking Table & Selected Provider Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rankings Table (2 cols) */}
        <NeoCard variant="white" className="p-5 lg:col-span-2" shadowSize="md">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#171717] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#171717]" />
                Provider Revenue Rankings
              </h2>
              <p className="text-[11px] text-neutral-500">
                Sorted strictly by Total Billed Revenue (highest first)
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold bg-[#F5E642] px-2 py-0.5 border border-[#171717]">
              {providerStats.list.length} Staff Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#171717] text-white uppercase font-black text-[10px]">
                <tr>
                  <th className="p-2 border-r border-neutral-700 text-center w-10">Rank</th>
                  <th className="p-2 border-r border-neutral-700">Performed Staff</th>
                  <th className="p-2 border-r border-neutral-700 text-right">Billed Revenue</th>
                  <th className="p-2 border-r border-neutral-700 text-right">Share</th>
                  <th className="p-2 border-r border-neutral-700 text-right">Records</th>
                  <th className="p-2 border-r border-neutral-700 text-right">Units</th>
                  <th className="p-2 text-right">Avg / Record</th>
                </tr>
              </thead>
              <tbody>
                {providerStats.list.map((p, idx) => {
                  const isSelected = p.name === selectedProvider;
                  return (
                    <tr
                      key={p.name}
                      onClick={() => setSelectedProvider(p.name)}
                      className={`border-b border-neutral-300 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#F5E642]/30 font-bold border-l-4 border-l-[#171717]'
                          : 'bg-white hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <td className="p-2 text-center font-mono font-bold text-neutral-500 border-r border-neutral-300">
                        #{idx + 1}
                      </td>
                      <td className="p-2 font-bold text-[#171717] border-r border-neutral-300">
                        {p.name}
                        {idx === 0 && (
                          <span className="ml-1.5 text-[9px] bg-[#171717] text-[#F5E642] px-1 py-0.2 uppercase font-black">
                            Top
                          </span>
                        )}
                      </td>
                      <td className="p-2 font-mono font-black text-right text-[#171717] border-r border-neutral-300 tabular-nums">
                        {formatINR(p.revenue)}
                      </td>
                      <td className="p-2 font-mono text-right text-neutral-600 border-r border-neutral-300 tabular-nums">
                        {p.revenueShare.toFixed(1)}%
                      </td>
                      <td className="p-2 font-mono text-right text-neutral-700 border-r border-neutral-300 tabular-nums">
                        {p.recordCount}
                      </td>
                      <td className="p-2 font-mono text-right text-neutral-700 border-r border-neutral-300 tabular-nums">
                        {p.totalQty}
                      </td>
                      <td className="p-2 font-mono text-right text-[#171717] tabular-nums">
                        {formatINR(p.avgBilled, false)}
                      </td>
                    </tr>
                  );
                })}

                {providerStats.list.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-neutral-500 font-mono">
                      No provider records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </NeoCard>

        {/* Selected Provider Spotlight (1 col) */}
        {activeProviderData ? (
          <NeoCard variant="white" className="p-5" shadowSize="md">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Provider Deep Dive
                </span>
                <h3 className="text-base font-black uppercase text-[#171717] truncate">
                  {activeProviderData.name}
                </h3>
              </div>
              <div className="w-8 h-8 bg-[#171717] text-[#F5E642] flex items-center justify-center font-bold text-xs border border-[#171717]">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2 bg-[#F7F5EF] border border-[#171717]">
                <span className="text-[10px] font-bold uppercase text-neutral-500 block">Revenue</span>
                <span className="font-mono font-black text-sm text-[#171717]">
                  {formatINR(activeProviderData.revenue)}
                </span>
              </div>
              <div className="p-2 bg-[#F7F5EF] border border-[#171717]">
                <span className="text-[10px] font-bold uppercase text-neutral-500 block">Avg / Record</span>
                <span className="font-mono font-bold text-sm text-[#171717]">
                  {formatINR(activeProviderData.avgBilled, false)}
                </span>
              </div>
            </div>

            {/* Category breakdown for this provider */}
            <div className="space-y-3 mb-5">
              <span className="text-xs font-black uppercase text-[#171717] flex items-center gap-1.5 pb-1 border-b border-neutral-300">
                <Layers className="w-3.5 h-3.5 text-[#171717]" />
                Category Breakdown
              </span>

              {Array.from(activeProviderData.categories.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([cat, rev]) => {
                  const pct = activeProviderData.revenue > 0 ? (rev / activeProviderData.revenue) * 100 : 0;
                  return (
                    <div key={cat} className="text-xs space-y-0.5">
                      <div className="flex justify-between font-medium">
                        <span className="truncate max-w-[150px]">{cat}</span>
                        <span className="font-mono font-bold">{formatINRCompact(rev)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-[#EFECE6] h-1.5 border border-neutral-400">
                        <div className="bg-[#5278FF] h-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Branch breakdown for this provider */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-[#171717] flex items-center gap-1.5 pb-1 border-b border-neutral-300">
                <Building className="w-3.5 h-3.5 text-[#171717]" />
                Active Branches
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(activeProviderData.branches.entries()).map(([br, rev]) => (
                  <span
                    key={br}
                    className="text-[11px] font-mono px-2 py-0.5 bg-[#FAF9F5] border border-[#171717]"
                  >
                    {br}: <strong>{formatINRCompact(rev)}</strong>
                  </span>
                ))}
              </div>
            </div>
          </NeoCard>
        ) : (
          <NeoCard variant="white" className="p-5" shadowSize="md">
            <div className="py-12 text-center text-xs text-neutral-500 font-mono">
              Select a provider to inspect details.
            </div>
          </NeoCard>
        )}
      </div>
    </div>
  );
};
