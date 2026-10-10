import React, { useState, useMemo } from 'react';
import { StandardMISRecord, CategoryMappingRule } from '../../types';
import { formatINR, formatINRCompact } from '../../utils/currency';
import { STANDARD_CATEGORIES } from '../../utils/categories';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { Layers, AlertTriangle, ArrowRight, Check, BarChart2, PieChart } from 'lucide-react';
import { formatMonthName } from '../../utils/date';

interface CategoryReportViewProps {
  records: StandardMISRecord[];
  onRemapCategory?: (rawCategory: string, newTargetCategory: string) => void;
}

export const CategoryReportView: React.FC<CategoryReportViewProps> = ({
  records,
  onRemapCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Group by Category
  const categoryStats = useMemo(() => {
    const totalRev = records.reduce((sum, r) => {
      if (r.validationStatus !== 'Error' && typeof r.billedAmount === 'number' && !isNaN(r.billedAmount)) {
        return sum + r.billedAmount;
      }
      return sum;
    }, 0);

    const totalLines = records.length;
    const totalQty = records.reduce((sum, r) => sum + (r.quantity || 0), 0);

    const map = new Map<
      string,
      {
        name: string;
        isStandard: boolean;
        isNeedsReview: boolean;
        revenue: number;
        count: number;
        qty: number;
        providers: Map<string, number>;
        branches: Map<string, number>;
        months: Map<string, number>;
        sampleItems: Set<string>;
      }
    >();

    records.forEach((r) => {
      const cat = r.serviceCategory || 'Uncategorized';
      if (!map.has(cat)) {
        const isStd = STANDARD_CATEGORIES.some((c) => c.toLowerCase() === cat.toLowerCase());
        map.set(cat, {
          name: cat,
          isStandard: isStd,
          isNeedsReview: Boolean(r.needsCategoryReview),
          revenue: 0,
          count: 0,
          qty: 0,
          providers: new Map(),
          branches: new Map(),
          months: new Map(),
          sampleItems: new Set(),
        });
      }

      const item = map.get(cat)!;
      if (r.validationStatus !== 'Error' && typeof r.billedAmount === 'number' && !isNaN(r.billedAmount)) {
        item.revenue += r.billedAmount;
      }
      item.count += 1;
      item.qty += r.quantity || 0;

      if (r.planItem) item.sampleItems.add(r.planItem);

      // Providers
      const p = r.provider || 'Unassigned';
      item.providers.set(p, (item.providers.get(p) || 0) + (r.validationStatus !== 'Error' ? r.billedAmount : 0));

      // Branches
      const br = r.branch || 'Unknown';
      item.branches.set(br, (item.branches.get(br) || 0) + (r.validationStatus !== 'Error' ? r.billedAmount : 0));

      // Months
      const m = r.month || 'Unknown';
      item.months.set(m, (item.months.get(m) || 0) + (r.validationStatus !== 'Error' ? r.billedAmount : 0));
    });

    const list = Array.from(map.values())
      .map((item) => ({
        ...item,
        revenueShare: totalRev > 0 ? (item.revenue / totalRev) * 100 : 0,
        volumeShare: totalLines > 0 ? (item.count / totalLines) * 100 : 0,
        avgTicket: item.count > 0 ? item.revenue / item.count : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return { list, totalRev, totalLines, totalQty };
  }, [records]);

  // Set default selected category
  React.useEffect(() => {
    if (!selectedCategory && categoryStats.list.length > 0) {
      setSelectedCategory(categoryStats.list[0].name);
    }
  }, [categoryStats.list, selectedCategory]);

  const activeCategoryData = useMemo(() => {
    return categoryStats.list.find((c) => c.name === selectedCategory) || categoryStats.list[0] || null;
  }, [categoryStats.list, selectedCategory]);

  // Needs review records
  const needsReviewRecords = useMemo(() => {
    return records.filter((r) => r.needsCategoryReview);
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Category Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryStats.list.map((cat) => {
          const isSelected = cat.name === selectedCategory;
          return (
            <div
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`p-4 border-2 transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-[#F5E642] border-[#171717] shadow-[4px_4px_0px_#171717]'
                  : 'bg-white border-[#171717] shadow-[2px_2px_0px_#171717] hover:bg-[#FAF9F5]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#171717] truncate max-w-[170px]">
                  {cat.name}
                </span>
                {cat.isNeedsReview && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#FF715B] text-white border border-[#171717]">
                    Needs Review
                  </span>
                )}
              </div>

              <div className="text-xl font-black font-mono tracking-tight text-[#171717] tabular-nums">
                {formatINR(cat.revenue)}
              </div>

              <div className="mt-2 pt-2 border-t border-[#171717]/20 flex items-center justify-between text-[11px] font-semibold text-neutral-700">
                <span>{cat.count} lines ({cat.revenueShare.toFixed(1)}%)</span>
                <span className="font-mono">{formatINRCompact(cat.avgTicket)} avg</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Grid: Comparison & Selected Category Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full Category Table (2 cols) */}
        <NeoCard variant="white" className="p-5 lg:col-span-2" shadowSize="md">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#171717] flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#171717]" />
                Category Performance Matrix
              </h2>
              <p className="text-[11px] text-neutral-500">
                Revenue and service line contributions across hospital departments
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold bg-[#F5E642] px-2 py-0.5 border border-[#171717]">
              Reconciled Total: {formatINR(categoryStats.totalRev)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#171717] text-white uppercase font-black text-[10px]">
                <tr>
                  <th className="p-2 border-r border-neutral-700">Category</th>
                  <th className="p-2 border-r border-neutral-700 text-right">Revenue (₹)</th>
                  <th className="p-2 border-r border-neutral-700 text-right">% Revenue</th>
                  <th className="p-2 border-r border-neutral-700 text-right">Line Count</th>
                  <th className="p-2 border-r border-neutral-700 text-right">Total Qty</th>
                  <th className="p-2 text-right">Avg / Record</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.list.map((c) => (
                  <tr
                    key={c.name}
                    onClick={() => setSelectedCategory(c.name)}
                    className={`border-b border-neutral-300 transition-colors cursor-pointer ${
                      c.name === selectedCategory ? 'bg-[#F5E642]/20 font-bold' : 'hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <td className="p-2 font-bold text-[#171717] border-r border-neutral-300">
                      {c.name}
                      {c.isNeedsReview && (
                        <span className="ml-1 text-[9px] bg-[#FF715B] text-white px-1 font-bold">
                          Review
                        </span>
                      )}
                    </td>
                    <td className="p-2 font-mono font-black text-right text-[#171717] border-r border-neutral-300 tabular-nums">
                      {formatINR(c.revenue)}
                    </td>
                    <td className="p-2 font-mono text-right text-neutral-600 border-r border-neutral-300 tabular-nums">
                      {c.revenueShare.toFixed(1)}%
                    </td>
                    <td className="p-2 font-mono text-right text-neutral-700 border-r border-neutral-300 tabular-nums">
                      {c.count}
                    </td>
                    <td className="p-2 font-mono text-right text-neutral-700 border-r border-neutral-300 tabular-nums">
                      {c.qty}
                    </td>
                    <td className="p-2 font-mono text-right text-[#171717] tabular-nums">
                      {formatINR(c.avgTicket, false)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </NeoCard>

        {/* Selected Category Spotlight (1 col) */}
        {activeCategoryData && (
          <NeoCard variant="white" className="p-5" shadowSize="md">
            <div className="pb-3 border-b-2 border-[#171717] mb-4">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                Category Breakdown
              </span>
              <h3 className="text-base font-black uppercase text-[#171717] truncate">
                {activeCategoryData.name}
              </h3>
            </div>

            {/* Providers performing this category */}
            <div className="space-y-3 mb-5">
              <span className="text-xs font-black uppercase text-[#171717] block pb-1 border-b border-neutral-300">
                Top Providers in {activeCategoryData.name}
              </span>
              {Array.from(activeCategoryData.providers.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([pName, pRev]) => {
                  const share = activeCategoryData.revenue > 0 ? (pRev / activeCategoryData.revenue) * 100 : 0;
                  return (
                    <div key={pName} className="text-xs space-y-0.5">
                      <div className="flex justify-between font-medium">
                        <span className="truncate max-w-[150px]">{pName}</span>
                        <span className="font-mono font-bold">{formatINRCompact(pRev)} ({share.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-[#EFECE6] h-1.5 border border-neutral-400">
                        <div className="bg-[#5278FF] h-full" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Branches billing this category */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-[#171717] block pb-1 border-b border-neutral-300">
                Branch Distribution
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(activeCategoryData.branches.entries()).map(([br, rev]) => (
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
        )}
      </div>

      {/* NEEDS REVIEW PANEL (If any unmapped categories exist) */}
      {needsReviewRecords.length > 0 && (
        <NeoCard variant="white" className="p-5 border-2 border-[#FF715B]" shadowSize="md">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#FF715B] mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#FF715B] text-white p-1">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-[#171717]">
                  Unmapped Categories Awaiting Administrator Review ({needsReviewRecords.length} Lines)
                </h3>
                <p className="text-[11px] text-neutral-600">
                  Per MIS guidelines, unmapped categories are never forcefully altered. You can assign them to a standard category below.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {needsReviewRecords.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="p-3 bg-[#FAF9F5] border-2 border-[#171717] flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-[#171717]">{r.planItem}</div>
                  <div className="text-[11px] text-neutral-500 font-mono">
                    Raw Source Category: <strong className="text-[#FF715B]">"{r.rawCategory}"</strong> | Invoice #{r.invoiceNo} | {r.provider}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#171717]">
                    {formatINR(r.billedAmount)}
                  </span>
                  {onRemapCategory && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onRemapCategory(r.rawCategory, e.target.value);
                        }
                      }}
                      className="bg-white border-2 border-[#171717] text-xs font-bold p-1"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Map to Standard Category...
                      </option>
                      {STANDARD_CATEGORIES.map((std) => (
                        <option key={std} value={std}>
                          {std}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </NeoCard>
      )}
    </div>
  );
};
