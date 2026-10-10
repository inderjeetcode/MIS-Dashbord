import React from 'react';
import { StandardMISRecord, ImportBatch } from '../../types';
import { formatINR, formatINRCompact } from '../../utils/currency';
import { NeoCard } from '../common/NeoCard';
import {
  IndianRupee,
  Layers,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  TrendingUp,
  FileCheck,
  Info,
  HelpCircle,
} from 'lucide-react';
import { formatMonthName } from '../../utils/date';

interface DashboardViewProps {
  records: StandardMISRecord[];
  allRecords: StandardMISRecord[];
  latestBatch?: ImportBatch;
  onNavigateUpload: () => void;
  onNavigateDetailed: () => void;
  onNavigateCategories: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  allRecords,
  latestBatch,
  onNavigateUpload,
  onNavigateDetailed,
  onNavigateCategories,
}) => {
  // CRITICAL REVENUE CALCULATION:
  // Billed Amount is ALREADY the total amount for the service line. Never multiply by quantity!
  const {
    totalBilledRevenue,
    totalRecords,
    totalQuantity,
    totalProviders,
    avgBilledPerRecord,
    zeroValueLinesCount,
    validCount,
    warningCount,
    errorCount,
    needsReviewCount,
    duplicateCount,
  } = React.useMemo(() => {
    let rev = 0;
    let qty = 0;
    const providerSet = new Set<string>();
    let zeroCount = 0;
    let vCount = 0;
    let wCount = 0;
    let eCount = 0;
    let reviewCount = 0;
    let dupCount = 0;

    records.forEach((r) => {
      // Exclude invalid/error records from numeric sums
      if (r.validationStatus !== 'Error' && typeof r.billedAmount === 'number' && !isNaN(r.billedAmount)) {
        rev += r.billedAmount; // EXACT sum of billed amounts
      }
      qty += r.quantity || 0;
      if (r.provider && r.provider.trim()) {
        providerSet.add(r.provider.trim());
      }
      if (r.billedAmount === 0) {
        zeroCount++;
      }
      if (r.validationStatus === 'Valid') vCount++;
      else if (r.validationStatus === 'Warning') wCount++;
      else if (r.validationStatus === 'Error') eCount++;

      if (r.needsCategoryReview) reviewCount++;
      if (r.isPotentialDuplicate) dupCount++;
    });

    const avg = records.length > 0 ? rev / records.length : 0;

    return {
      totalBilledRevenue: rev,
      totalRecords: records.length,
      totalQuantity: qty,
      totalProviders: providerSet.size,
      avgBilledPerRecord: avg,
      zeroValueLinesCount: zeroCount,
      validCount: vCount,
      warningCount: wCount,
      errorCount: eCount,
      needsReviewCount: reviewCount,
      duplicateCount: dupCount,
    };
  }, [records]);

  // Provider-wise breakdown
  const providerData = React.useMemo(() => {
    const map = new Map<string, { revenue: number; count: number; qty: number }>();
    records.forEach((r) => {
      const p = r.provider || 'Unassigned Staff';
      const existing = map.get(p) || { revenue: 0, count: 0, qty: 0 };
      if (r.validationStatus !== 'Error') {
        existing.revenue += r.billedAmount;
      }
      existing.count += 1;
      existing.qty += r.quantity || 0;
      map.set(p, existing);
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        count: data.count,
        qty: data.qty,
        percentage: totalBilledRevenue > 0 ? (data.revenue / totalBilledRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [records, totalBilledRevenue]);

  // Category-wise breakdown
  const categoryData = React.useMemo(() => {
    const map = new Map<string, { revenue: number; count: number; isNeedsReview: boolean }>();
    records.forEach((r) => {
      const cat = r.serviceCategory || 'Uncategorized';
      const existing = map.get(cat) || { revenue: 0, count: 0, isNeedsReview: Boolean(r.needsCategoryReview) };
      if (r.validationStatus !== 'Error') {
        existing.revenue += r.billedAmount;
      }
      existing.count += 1;
      map.set(cat, existing);
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        count: data.count,
        isNeedsReview: data.isNeedsReview,
        percentage: totalBilledRevenue > 0 ? (data.revenue / totalBilledRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [records, totalBilledRevenue]);

  // Monthly revenue trend
  const monthlyData = React.useMemo(() => {
    const map = new Map<string, { revenue: number; count: number }>();
    records.forEach((r) => {
      const m = r.month || 'Missing Month';
      const existing = map.get(m) || { revenue: 0, count: 0 };
      if (r.validationStatus !== 'Error') {
        existing.revenue += r.billedAmount;
      }
      existing.count += 1;
      map.set(m, existing);
    });

    return Array.from(map.entries())
      .filter(([m]) => m !== 'Missing Month')
      .map(([monthKey, data]) => ({
        monthKey,
        label: formatMonthName(monthKey),
        revenue: data.revenue,
        count: data.count,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [records]);

  // Branch-wise revenue
  const branchData = React.useMemo(() => {
    const map = new Map<string, { revenue: number; count: number }>();
    records.forEach((r) => {
      const b = r.branch || 'Unknown';
      const existing = map.get(b) || { revenue: 0, count: 0 };
      if (r.validationStatus !== 'Error') {
        existing.revenue += r.billedAmount;
      }
      existing.count += 1;
      map.set(b, existing);
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        count: data.count,
        percentage: totalBilledRevenue > 0 ? (data.revenue / totalBilledRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [records, totalBilledRevenue]);

  const maxProviderRev = providerData.length > 0 ? providerData[0].revenue : 1;
  const maxCategoryRev = categoryData.length > 0 ? categoryData[0].revenue : 1;
  const maxMonthlyRev = monthlyData.length > 0 ? Math.max(...monthlyData.map((m) => m.revenue)) : 1;

  return (
    <div className="space-y-6">
      {/* Critical Calculation Banner */}
      <div className="bg-[#171717] text-[#F7F5EF] p-3 border-2 border-[#171717] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="bg-[#F5E642] text-[#171717] font-black px-2 py-0.5 text-[10px] uppercase">
            Rule Verified
          </span>
          <span className="font-semibold">
            Billed Amount is the complete service line total. Never multiplied by quantity.
          </span>
        </div>
        <div className="flex items-center gap-2 text-neutral-300 font-mono text-[11px]">
          <span>Invoice Date used for billing periods</span>
          <span>·</span>
          <span>Zero-value lines tracked: {zeroValueLinesCount}</span>
        </div>
      </div>

      {/* 4 PRIMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Billed Revenue */}
        <NeoCard variant="yellow" className="p-4" shadowSize="md">
          <div className="flex items-center justify-between text-[#171717] mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">
              Total Billed Revenue
            </span>
            <IndianRupee className="w-5 h-5 text-[#171717]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#171717] tabular-nums">
            {formatINR(totalBilledRevenue)}
          </div>
          <div className="mt-2 pt-2 border-t border-[#171717]/30 flex items-center justify-between text-[11px] font-bold text-neutral-800">
            <span>Filtered Scope</span>
            <span className="font-mono">{records.length} Service Lines</span>
          </div>
        </NeoCard>

        {/* KPI 2: Actual Collected Amount (MANDATORY: SHOW NOT AVAILABLE) */}
        <NeoCard variant="white" className="p-4 bg-neutral-100" shadowSize="md">
          <div className="flex items-center justify-between text-neutral-600 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700">
              Actual Collected Amount
            </span>
            <HelpCircle className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black uppercase font-mono tracking-wide text-neutral-600 mt-1">
            Not Available
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-300 text-[10px] font-medium text-neutral-600 leading-tight">
            VETport sales schema does not provide payment receipts. Never derived from billed amount.
          </div>
        </NeoCard>

        {/* KPI 3: Total Service Records */}
        <NeoCard variant="white" className="p-4" shadowSize="md">
          <div className="flex items-center justify-between text-[#171717] mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">
              Total Service Records
            </span>
            <Layers className="w-5 h-5 text-[#171717]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#171717] tabular-nums">
            {totalRecords.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between text-[11px] font-bold text-neutral-600">
            <span>Total Units (Qty)</span>
            <span className="font-mono text-[#171717]">{totalQuantity.toLocaleString('en-IN')} Units</span>
          </div>
        </NeoCard>

        {/* KPI 4: Total Providers / Staff */}
        <NeoCard variant="white" className="p-4" shadowSize="md">
          <div className="flex items-center justify-between text-[#171717] mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">
              Total Providers / Staff
            </span>
            <Users className="w-5 h-5 text-[#171717]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#171717] tabular-nums">
            {totalProviders}
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between text-[11px] font-bold text-neutral-600">
            <span>Avg / Service Line</span>
            <span className="font-mono text-[#171717]">{formatINR(avgBilledPerRecord, false)}</span>
          </div>
        </NeoCard>
      </div>

      {/* SECONDARY METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-xs">
        <div className="border-r-2 border-neutral-200 pr-2">
          <div className="text-[10px] font-bold uppercase text-neutral-500">Average Per Line</div>
          <div className="text-base font-black font-mono text-[#171717] tabular-nums">
            {formatINR(avgBilledPerRecord)}
          </div>
        </div>
        <div className="border-r-2 border-neutral-200 pr-2">
          <div className="text-[10px] font-bold uppercase text-neutral-500">Total Quantity Delivered</div>
          <div className="text-base font-black font-mono text-[#171717] tabular-nums">
            {totalQuantity} Units
          </div>
        </div>
        <div className="border-r-2 border-neutral-200 pr-2">
          <div className="text-[10px] font-bold uppercase text-neutral-500">Complimentary / Zero Value</div>
          <div className="text-base font-black font-mono text-[#171717] tabular-nums">
            {zeroValueLinesCount} Lines
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase text-neutral-500">Active Hospital Branches</div>
          <div className="text-base font-black font-mono text-[#171717] tabular-nums">
            {branchData.length} Branches
          </div>
        </div>
      </div>

      {/* VISUALIZATION GRID: PROVIDER & SERVICE CATEGORY REVENUE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider-wise billed revenue */}
        <NeoCard variant="white" className="p-5 flex flex-col justify-between" shadowSize="md">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-[#171717]">
                  Provider-Wise Billed Revenue
                </h2>
                <p className="text-[11px] text-neutral-500 font-medium">
                  Ranked by billed amount (Performed Staff field)
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold bg-[#F5E642] px-2 py-0.5 border border-[#171717]">
                {providerData.length} Staff
              </span>
            </div>

            <div className="space-y-3">
              {providerData.slice(0, 6).map((item, idx) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-neutral-400 w-4">
                        0{idx + 1}
                      </span>
                      <span className="font-bold text-[#171717] truncate max-w-[180px] sm:max-w-[240px]">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-[#171717] tabular-nums">
                        {formatINR(item.revenue)}
                      </span>
                      <span className="text-[10px] text-neutral-500 ml-1.5 font-mono">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-[#EFECE6] h-3 border border-[#171717] overflow-hidden">
                    <div
                      className="bg-[#5278FF] h-full transition-all duration-300"
                      style={{ width: `${(item.revenue / (maxProviderRev || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>{item.count} service lines</span>
                    <span>{item.qty} units</span>
                  </div>
                </div>
              ))}

              {providerData.length === 0 && (
                <div className="py-8 text-center text-xs text-neutral-500 font-mono">
                  No provider data matching active filters.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-200 flex justify-end">
            <button
              onClick={onNavigateDetailed}
              className="text-xs font-bold uppercase tracking-wider text-[#171717] hover:underline cursor-pointer"
            >
              View All In Detailed MIS →
            </button>
          </div>
        </NeoCard>

        {/* Service Category-wise revenue */}
        <NeoCard variant="white" className="p-5 flex flex-col justify-between" shadowSize="md">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-[#171717]">
                  Service Category-Wise Revenue
                </h2>
                <p className="text-[11px] text-neutral-500 font-medium">
                  Standardized categories & Needs Review items
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold bg-[#F5E642] px-2 py-0.5 border border-[#171717]">
                {categoryData.length} Categories
              </span>
            </div>

            <div className="space-y-3">
              {categoryData.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#171717] truncate max-w-[180px] sm:max-w-[240px]">
                        {item.name}
                      </span>
                      {item.isNeedsReview && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#FF715B] text-white border border-[#171717] uppercase">
                          Needs Review
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-[#171717] tabular-nums">
                        {formatINR(item.revenue)}
                      </span>
                      <span className="text-[10px] text-neutral-500 ml-1.5 font-mono">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-[#EFECE6] h-3 border border-[#171717] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        item.isNeedsReview ? 'bg-[#FF715B]' : 'bg-[#F5E642]'
                      }`}
                      style={{ width: `${(item.revenue / (maxCategoryRev || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>{item.count} service lines</span>
                    <span>Subtotal: {formatINRCompact(item.revenue)}</span>
                  </div>
                </div>
              ))}

              {categoryData.length === 0 && (
                <div className="py-8 text-center text-xs text-neutral-500 font-mono">
                  No category records matching active filters.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-200 flex justify-between items-center text-xs">
            {needsReviewCount > 0 ? (
              <button
                onClick={onNavigateCategories}
                className="text-[#FF715B] font-black uppercase text-[11px] hover:underline cursor-pointer flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Review {needsReviewCount} unmapped items →
              </button>
            ) : (
              <span className="text-neutral-500 text-[11px]">All categories standard</span>
            )}
            <button
              onClick={onNavigateCategories}
              className="font-bold uppercase tracking-wider text-[#171717] hover:underline cursor-pointer"
            >
              Category Breakdown →
            </button>
          </div>
        </NeoCard>
      </div>

      {/* MONTHLY REVENUE TREND & BRANCH-WISE REVENUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend (2 cols) */}
        <NeoCard variant="white" className="p-5 lg:col-span-2" shadowSize="md">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#171717]">
                Monthly Billed Revenue Trend
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium">
                Derived directly from source Invoice Date (YYYY-MM)
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-600">
              <Calendar className="w-3.5 h-3.5" />
              <span>FY 2026-27</span>
            </div>
          </div>

          {monthlyData.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
              {monthlyData.map((m) => {
                const heightPct = Math.max(12, Math.round((m.revenue / (maxMonthlyRev || 1)) * 100));
                return (
                  <div key={m.monthKey} className="flex flex-col items-center justify-end h-48 border border-neutral-200 bg-[#FAF9F5] p-2">
                    <div className="text-[10px] font-mono font-bold text-[#171717] tabular-nums mb-1">
                      {formatINRCompact(m.revenue)}
                    </div>
                    <div className="w-full bg-[#EFECE6] h-28 border border-[#171717] flex items-end overflow-hidden">
                      <div
                        className="w-full bg-[#171717] hover:bg-[#F5E642] transition-colors"
                        style={{ height: `${heightPct}%` }}
                        title={`${m.label}: ${formatINR(m.revenue)} (${m.count} records)`}
                      />
                    </div>
                    <div className="mt-2 text-[10px] font-black uppercase text-center text-[#171717] truncate w-full">
                      {m.monthKey.split('-')[1]}/26
                    </div>
                    <div className="text-[9px] text-neutral-500 font-mono">
                      {m.count} recs
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-neutral-500 font-mono">
              No monthly dates found in filtered data.
            </div>
          )}
        </NeoCard>

        {/* Branch-wise breakdown (1 col) */}
        <NeoCard variant="white" className="p-5" shadowSize="md">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#171717]">
                Branch-Wise Revenue
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium">
                Hospital location share
              </p>
            </div>
            <Building className="w-4 h-4 text-[#171717]" />
          </div>

          <div className="space-y-3">
            {branchData.map((b) => (
              <div key={b.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#171717]">{b.name}</span>
                  <span className="font-mono font-bold text-[#171717] tabular-nums">
                    {formatINRCompact(b.revenue)}
                    <span className="text-[10px] text-neutral-500 ml-1">({b.percentage.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="w-full bg-[#EFECE6] h-2.5 border border-[#171717] overflow-hidden">
                  <div
                    className="bg-[#171717] h-full"
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-neutral-500 font-mono text-right">
                  {b.count} records
                </div>
              </div>
            ))}

            {branchData.length === 0 && (
              <div className="py-8 text-center text-xs text-neutral-500 font-mono">
                No branch data matching filters.
              </div>
            )}
          </div>
        </NeoCard>
      </div>

      {/* DATA QUALITY & VALIDATION ALERTS CARD */}
      <NeoCard variant="white" className="p-5" shadowSize="md">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-[#171717] text-[#F5E642] p-1 border border-[#171717]">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#171717]">
                Data Quality & Validation Health Audit
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium">
                VETport ingestion rule compliance & duplicate prevention
              </p>
            </div>
          </div>

          {latestBatch && (
            <span className="text-[10px] font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 border border-neutral-300">
              Batch: {latestBatch.fileName}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border-2 border-[#171717] p-3 bg-[#f3faf4]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-green-800 uppercase">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Valid Records
            </div>
            <div className="text-2xl font-black font-mono text-green-900 mt-1 tabular-nums">
              {validCount}
            </div>
            <div className="text-[10px] text-green-700 mt-0.5 font-medium">
              Passed all schema criteria
            </div>
          </div>

          <div className="border-2 border-[#171717] p-3 bg-[#fffdf0]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Warnings / Review
            </div>
            <div className="text-2xl font-black font-mono text-amber-900 mt-1 tabular-nums">
              {warningCount}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
              Zero-value or minor notes
            </div>
          </div>

          <div className="border-2 border-[#171717] p-3 bg-[#fff5f5]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 uppercase">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Duplicate Lines Flagged
            </div>
            <div className="text-2xl font-black font-mono text-red-900 mt-1 tabular-nums">
              {duplicateCount}
            </div>
            <div className="text-[10px] text-red-700 mt-0.5 font-medium">
              Exact matching service lines
            </div>
          </div>

          <div className="border-2 border-[#171717] p-3 bg-[#f5f8ff]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 uppercase">
              <Layers className="w-4 h-4 text-blue-600" />
              Needs Review Categories
            </div>
            <div className="text-2xl font-black font-mono text-blue-900 mt-1 tabular-nums">
              {needsReviewCount}
            </div>
            <div className="text-[10px] text-blue-700 mt-0.5 font-medium">
              Unmapped source categories
            </div>
          </div>
        </div>
      </NeoCard>
    </div>
  );
};
