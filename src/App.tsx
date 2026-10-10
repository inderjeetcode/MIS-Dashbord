import React, { useState, useEffect, useMemo } from 'react';
import { StandardMISRecord, ImportBatch, FilterState, CategoryMappingRule, ValidationRulesConfig } from './types';
import { createInitialSampleBatch } from './utils/sampleData';
import { DEFAULT_CATEGORY_RULES } from './utils/categories';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { FiltersBar } from './components/common/FiltersBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { UploadView } from './components/upload/UploadView';
import { DetailedMISView } from './components/detailed/DetailedMISView';
import { ProviderPerformanceView } from './components/providers/ProviderPerformanceView';
import { CategoryReportView } from './components/categories/CategoryReportView';
import { MonthlyMISView } from './components/monthly/MonthlyMISView';
import { ImportHistoryView } from './components/history/ImportHistoryView';
import { SettingsView } from './components/settings/SettingsView';

const STORAGE_KEY_RECORDS = 'vetport_mis_records_v1';
const STORAGE_KEY_BATCHES = 'vetport_mis_batches_v1';
const STORAGE_KEY_RULES = 'vetport_mis_category_rules_v1';

export default function App() {
  // Navigation & UI state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Core Data state
  const [batches, setBatches] = useState<ImportBatch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BATCHES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load batches from localStorage', e);
    }
    const { batch } = createInitialSampleBatch();
    return [batch];
  });

  const [records, setRecords] = useState<StandardMISRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load records from localStorage', e);
    }
    const { records } = createInitialSampleBatch();
    return records;
  });

  const [categoryRules, setCategoryRules] = useState<CategoryMappingRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RULES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load rules from localStorage', e);
    }
    return DEFAULT_CATEGORY_RULES;
  });

  const [validationConfig, setValidationConfig] = useState<ValidationRulesConfig>({
    flagZeroBilledAmount: true,
    flagNegativeBilledAmount: true,
    flagMissingProvider: true,
    flagMissingBranch: true,
    flagUnmappedCategory: true,
    flagDuplicateServiceLines: true,
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(batches));
    } catch (e) {
      console.warn('Error saving batches', e);
    }
  }, [batches]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.warn('Error saving records', e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(categoryRules));
    } catch (e) {
      console.warn('Error saving rules', e);
    }
  }, [categoryRules]);

  // Global Filters State
  const initialFilters: FilterState = {
    period: 'all',
    startDate: '',
    endDate: '',
    branch: 'all',
    provider: 'all',
    category: 'all',
    validationStatus: 'all',
    searchQuery: '',
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const handleFilterChange = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  // Filtered Records calculation (applies global filters across all views)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Date Period filter
      if (filters.period === 'cur-month') {
        if (r.month !== '2026-10') return false;
      } else if (filters.period === 'prev-month') {
        if (r.month !== '2026-09') return false;
      } else if (filters.period === 'fy26-td') {
        if (!r.invoiceDate || r.invoiceDate < '2026-04-01' || r.invoiceDate > '2026-10-31') return false;
      } else if (filters.period === 'custom') {
        if (filters.startDate && r.invoiceDate < filters.startDate) return false;
        if (filters.endDate && r.invoiceDate > filters.endDate) return false;
      }

      // Branch filter
      if (filters.branch !== 'all' && r.branch !== filters.branch) {
        return false;
      }

      // Provider filter
      if (filters.provider !== 'all' && r.provider !== filters.provider) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && r.serviceCategory !== filters.category) {
        return false;
      }

      return true;
    });
  }, [records, filters]);

  // Handler when user imports a new batch via Upload Data
  const handleImportComplete = (newBatch: ImportBatch, newRecords: StandardMISRecord[]) => {
    setBatches((prev) => [newBatch, ...prev]);
    setRecords((prev) => [...newRecords, ...prev]);
    setCurrentTab('detailed');
  };

  // Handler to remap an unmapped category in-place
  const handleRemapCategory = (rawCategory: string, newTargetCategory: string) => {
    setCategoryRules((prev) => [
      ...prev,
      {
        id: `rule-remap-${Date.now()}`,
        pattern: rawCategory.toLowerCase().trim(),
        targetCategory: newTargetCategory,
      },
    ]);

    setRecords((prev) =>
      prev.map((r) => {
        if (r.rawCategory.toLowerCase().trim() === rawCategory.toLowerCase().trim()) {
          return {
            ...r,
            serviceCategory: newTargetCategory,
            needsCategoryReview: false,
            notes: r.notes.filter((n) => !n.includes('needs review')),
          };
        }
        return r;
      })
    );
  };

  // Handler to remove a batch if needed
  const handleRemoveBatch = (batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    setRecords((prev) => prev.filter((r) => r.importBatchId !== batchId));
  };

  const tabLabels: Record<string, string> = {
    dashboard: 'Executive Overview',
    upload: 'Upload Data Pipeline',
    detailed: 'Detailed Standardized MIS',
    providers: 'Provider Performance Matrix',
    categories: 'Service Category Analytics',
    monthly: 'Monthly Revenue Comparison',
    history: 'Import Batch History',
    settings: 'Settings & Administration',
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#171717] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        totalRecordsCount={records.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigateUpload={() => setCurrentTab('upload')}
          activeTabLabel={tabLabels[currentTab] || currentTab}
          totalRecordsCount={records.length}
        />

        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl mx-auto w-full">
          {/* Global Filter Bar (visible on data-driven tabs) */}
          {['dashboard', 'detailed', 'providers', 'categories', 'monthly'].includes(currentTab) && (
            <FiltersBar
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
              records={records}
            />
          )}

          {/* Tab Views */}
          {currentTab === 'dashboard' && (
            <DashboardView
              records={filteredRecords}
              allRecords={records}
              latestBatch={batches[0]}
              onNavigateUpload={() => setCurrentTab('upload')}
              onNavigateDetailed={() => setCurrentTab('detailed')}
              onNavigateCategories={() => setCurrentTab('categories')}
            />
          )}

          {currentTab === 'upload' && (
            <UploadView
              onImportComplete={handleImportComplete}
              existingRecords={records}
              categoryRules={categoryRules}
            />
          )}

          {currentTab === 'detailed' && (
            <DetailedMISView records={filteredRecords} />
          )}

          {currentTab === 'providers' && (
            <ProviderPerformanceView records={filteredRecords} />
          )}

          {currentTab === 'categories' && (
            <CategoryReportView
              records={filteredRecords}
              onRemapCategory={handleRemapCategory}
            />
          )}

          {currentTab === 'monthly' && (
            <MonthlyMISView records={filteredRecords} />
          )}

          {currentTab === 'history' && (
            <ImportHistoryView
              batches={batches}
              records={records}
              onRemoveBatch={handleRemoveBatch}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              categoryRules={categoryRules}
              onAddCategoryRule={(rule) => setCategoryRules((prev) => [rule, ...prev])}
              onRemoveCategoryRule={(id) => setCategoryRules((prev) => prev.filter((r) => r.id !== id))}
              validationConfig={validationConfig}
              onUpdateValidationConfig={setValidationConfig}
            />
          )}
        </main>
      </div>
    </div>
  );
}
