import React, { useMemo, useState } from 'react';
import { StandardMISRecord } from '../../types';
import { formatINR, formatINRCompact } from '../../utils/currency';
import { formatMonthName } from '../../utils/date';
import { NeoCard } from '../common/NeoCard';
import { Calendar, TrendingUp, TrendingDown, Minus, Info, ArrowUpRight } from 'lucide-react';

interface MonthlyMISViewProps {
  records: StandardMISRecord[];
}

export const MonthlyMISView: React.FC<MonthlyMISViewProps> = ({ records }) => {
  const [matrixView, setMatrixView] = useState<'branch' | 'category' | 'provider'>('branch');

  // Group by Month (using Invoice Date strictly)
  const monthlyAggregates = useMemo(() => {
    const map = new Map<
      string,
      {
        monthKey: string;
        label: string;
        revenue: number;
        lineCount: number;
        totalQty: number;
      }
    >();

    records.forEach((r) => {
      const m = r.month;
      if (!m || m === 'Missing Month') return;

      if (!map.has(m)) {
        map.set(m, {
          monthKey: m,
          label: formatMonthName(m),
          revenue: 0,
          lineCount: 0,
          totalQty: 0,
        });
      }

      const item = map.get(m)!;
      if (r.validationStatus !== 'Error' && typeof r.billedAmount === 'number' && !isNaN(r.billedAmount)) {
        item.revenue += r.billedAmount;
      }
      item.lineCount += 1;
      item.totalQty += r.quantity || 0;
    });

    const sortedMonths = Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    // Calculate Month-on-Month changes
    const listWithMoM = sortedMonths.map((curr, idx) => {
      const prev = idx > 0 ? sortedMonths[idx - 1] : null;
      let momAbsChange = 0;
      let momPctChange: number | null = null;

      if (prev) {
        momAbsChange = curr.revenue - prev.revenue;
        if (prev.revenue > 0) {
          momPctChange = ((curr.revenue - prev.revenue) / prev.revenue) * 100;
        }
      }

      return {
        ...curr,
        momAbsChange,
        momPctChange,
      };
    });

    return listWithMoM;
  }, [records]);

  // Check for October 2026, September 2026, and October 2025 specifically
  const oct2026 = useMemo(() => {
    return monthlyAggregates.find((m) => m.monthKey === '2026-10') || null;
  }, [monthlyAggregates]);

  const sep2026 = useMemo(() => {
    return monthlyAggregates.find((m) => m.monthKey === '2026-09') || null;
  }, [monthlyAggregates]);

  const oct2025 = useMemo(() => {
    return monthlyAggregates.find((m) => m.monthKey === '2025-10') || null;
  }, [monthlyAggregates]);

  // FYTD (April 2026 through October 2026)
  const fytdStats = useMemo(() => {
    const fyMonths = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
    const matching = monthlyAggregates.filter((m) => fyMonths.includes(m.monthKey));
    const totalRev = matching.reduce((sum, m) => sum + m.revenue, 0);
    const totalLines = matching.reduce((sum, m) => sum + m.lineCount, 0);
    return { totalRev, totalLines, count: matching.length };
  }, [monthlyAggregates]);

  // Matrix Dimension Breakdown
  const matrixData = useMemo(() => {
    const months = monthlyAggregates.map((m) => m.monthKey);
    const dimensionMap = new Map<string, Map<string, number>>();

    records.forEach((r) => {
      if (r.validationStatus === 'Error' || !r.month || r.month === 'Missing Month') return;

      let dimKey = 'Unknown';
      if (matrixView === 'branch') dimKey = r.branch || 'Unknown';
      else if (matrixView === 'category') dimKey = r.serviceCategory || 'Uncategorized';
      else if (matrixView === 'provider') dimKey = r.provider || 'Unassigned';

      if (!dimensionMap.has(dimKey)) {
        dimensionMap.set(dimKey, new Map());
      }

      const m = dimensionMap.get(dimKey)!;
      m.set(r.month, (m.get(r.month) || 0) + r.billedAmount);
    });

    const rows = Array.from(dimensionMap.entries())
      .map(([name, mData]) => {
        const total = Array.from(mData.values()).reduce((a, b) => a + b, 0);
        return { name, mData, total };
      })
      .sort((a, b) => b.total - a.total);

    return { months, rows };
  }, [records, monthlyAggregates, matrixView]);

  return (
    <div className="space-y-6">
      {/* Required Periods Comparison Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* October 2026 */}
        <NeoCard variant="white" className="p-4" shadowSize="md">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">
            October 2026 (Month-to-Date)
          </span>
          <div className="text-xl font-black font-mono text-[#171717] mt-1 tabular-nums">
            {oct2026 ? formatINR(oct2026.revenue) : '₹0.00'}
          </div>
          <div className="mt-2 text-[11px] text-neutral-600 font-medium">
            {oct2026 ? `${oct2026.lineCount} service lines billed` : 'No records imported'}
          </div>
        </NeoCard>

        {/* September 2026 */}
        <NeoCard variant="white" className="p-4" shadowSize="md">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">
            September 2026 (Previous Month)
          </span>
          <div className="text-xl font-black font-mono text-[#171717] mt-1 tabular-nums">
            {sep2026 ? formatINR(sep2026.revenue) : '₹0.00'}
          </div>
          <div className="mt-2 text-[11px] text-neutral-600 font-medium">
            {sep2026 ? `${sep2026.lineCount} service lines billed` : 'No records imported'}
          </div>
        </NeoCard>

        {/* October 2025 (Previous Year October) */}
        <NeoCard variant="white" className="p-4" shadowSize="md">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">
            October 2025 (Previous Year)
          </span>
          <div className="text-base font-black font-mono text-neutral-700 mt-1 uppercase">
            {oct2025 ? formatINR(oct2025.revenue) : 'Historical data unavailable'}
          </div>
          <div className="mt-2 text-[10px] text-neutral-500 font-medium leading-tight">
            {oct2025
              ? `${oct2025.lineCount} historical lines`
              : 'Never assumed as zero per revenue integrity policy.'}
          </div>
        </NeoCard>

        {/* April - October 2026 (FYTD) */}
        <NeoCard variant="yellow" className="p-4" shadowSize="md">
          <span className="text-[10px] font-black uppercase text-[#171717] block">
            April - October 2026 (FYTD)
          </span>
          <div className="text-xl font-black font-mono text-[#171717] mt-1 tabular-nums">
            {formatINR(fytdStats.totalRev)}
          </div>
          <div className="mt-2 text-[11px] font-bold text-neutral-800">
            {fytdStats.totalLines} lines across {fytdStats.count} months
          </div>
        </NeoCard>
      </div>

      {/* Monthly Billed Revenue Table with MoM Changes */}
      <NeoCard variant="white" className="p-5" shadowSize="md">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-[#171717] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#171717]" />
              Monthly Revenue Performance & MoM Growth
            </h2>
            <p className="text-[11px] text-neutral-500">
              Computed strictly from source Invoice Date. Excludes invalid/rejected rows.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#171717] text-white uppercase font-black text-[10px]">
              <tr>
                <th className="p-2 border-r border-neutral-700">Month</th>
                <th className="p-2 border-r border-neutral-700 text-right">Billed Revenue</th>
                <th className="p-2 border-r border-neutral-700 text-right">Line Records</th>
                <th className="p-2 border-r border-neutral-700 text-right">Total Units</th>
                <th className="p-2 border-r border-neutral-700 text-right">MoM Absolute Change</th>
                <th className="p-2 text-right">MoM % Change</th>
              </tr>
            </thead>
            <tbody>
              {monthlyAggregates.map((m, idx) => {
                const hasPrev = idx > 0;
                const isPositive = m.momAbsChange > 0;
                const isNegative = m.momAbsChange < 0;

                return (
                  <tr key={m.monthKey} className="border-b border-neutral-300 bg-white hover:bg-[#FAF9F5]">
                    <td className="p-2 font-bold text-[#171717] border-r border-neutral-300">
                      {m.label} ({m.monthKey})
                    </td>
                    <td className="p-2 font-mono font-black text-right text-[#171717] border-r border-neutral-300 tabular-nums">
                      {formatINR(m.revenue)}
                    </td>
                    <td className="p-2 font-mono text-right text-neutral-700 border-r border-neutral-300 tabular-nums">
                      {m.lineCount}
                    </td>
                    <td className="p-2 font-mono text-right text-neutral-700 border-r border-neutral-300 tabular-nums">
                      {m.totalQty}
                    </td>

                    {/* MoM Absolute Change */}
                    <td className="p-2 font-mono text-right border-r border-neutral-300 tabular-nums">
                      {!hasPrev ? (
                        <span className="text-neutral-400">Baseline</span>
                      ) : (
                        <span className={`font-bold ${isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-neutral-600'}`}>
                          {isPositive ? '+' : ''}{formatINR(m.momAbsChange)}
                        </span>
                      )}
                    </td>

                    {/* MoM % Change */}
                    <td className="p-2 font-mono text-right tabular-nums">
                      {!hasPrev || m.momPctChange === null ? (
                        <span className="text-neutral-400">N/A</span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 ${
                            isPositive
                              ? 'text-green-800 bg-green-100'
                              : isNegative
                              ? 'text-red-800 bg-red-100'
                              : 'text-neutral-700 bg-neutral-100'
                          }`}
                        >
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {isPositive ? '+' : ''}{m.momPctChange.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {monthlyAggregates.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-neutral-500 font-mono">
                    No valid monthly invoice date records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </NeoCard>

      {/* MONTHLY MULTI-DIMENSIONAL MATRIX */}
      <NeoCard variant="white" className="p-5" shadowSize="md">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b-2 border-[#171717] mb-4 gap-2">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-[#171717]">
              Multi-Dimensional Monthly Breakdown Matrix
            </h2>
            <p className="text-[11px] text-neutral-500">
              Cross-tabulate revenue trends across Hospital Branch, Service Category, or Performed Staff
            </p>
          </div>

          {/* Toggle matrix dimension */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 border-2 border-[#171717]">
            <button
              onClick={() => setMatrixView('branch')}
              className={`px-3 py-1 text-xs font-bold uppercase cursor-pointer ${
                matrixView === 'branch' ? 'bg-[#F5E642] text-[#171717]' : 'text-neutral-700 hover:text-black'
              }`}
            >
              Branch-Wise
            </button>
            <button
              onClick={() => setMatrixView('category')}
              className={`px-3 py-1 text-xs font-bold uppercase cursor-pointer ${
                matrixView === 'category' ? 'bg-[#F5E642] text-[#171717]' : 'text-neutral-700 hover:text-black'
              }`}
            >
              Category-Wise
            </button>
            <button
              onClick={() => setMatrixView('provider')}
              className={`px-3 py-1 text-xs font-bold uppercase cursor-pointer ${
                matrixView === 'provider' ? 'bg-[#F5E642] text-[#171717]' : 'text-neutral-700 hover:text-black'
              }`}
            >
              Provider-Wise
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead className="bg-[#171717] text-white uppercase font-black text-[10px]">
              <tr>
                <th className="p-2 border-r border-neutral-700">
                  {matrixView === 'branch' ? 'Branch' : matrixView === 'category' ? 'Service Category' : 'Performed Staff'}
                </th>
                {matrixData.months.map((m) => (
                  <th key={m} className="p-2 border-r border-neutral-700 text-right whitespace-nowrap">
                    {formatMonthName(m).split(' ')[0]} {m.split('-')[0].slice(2)}
                  </th>
                ))}
                <th className="p-2 text-right bg-[#F5E642] text-[#171717]">Total Billed</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.rows.map((row) => (
                <tr key={row.name} className="border-b border-neutral-300 bg-white hover:bg-[#FAF9F5]">
                  <td className="p-2 font-bold text-[#171717] border-r border-neutral-300">
                    {row.name}
                  </td>
                  {matrixData.months.map((m) => {
                    const rev = row.mData.get(m) || 0;
                    return (
                      <td key={m} className="p-2 font-mono text-right border-r border-neutral-300 tabular-nums">
                        {rev > 0 ? formatINRCompact(rev) : '-'}
                      </td>
                    );
                  })}
                  <td className="p-2 font-mono font-black text-right text-[#171717] tabular-nums bg-[#FAF9F5]">
                    {formatINR(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </NeoCard>
    </div>
  );
};
