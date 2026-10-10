import React, { useState } from 'react';
import { CategoryMappingRule, ValidationRulesConfig } from '../../types';
import { STANDARD_CATEGORIES } from '../../utils/categories';
import { downloadVETportTemplate } from '../../utils/exporter';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import {
  Sliders,
  Layers,
  MapPin,
  User,
  ShieldAlert,
  FileDown,
  Plus,
  Trash2,
  Info,
  Check,
} from 'lucide-react';

interface SettingsViewProps {
  categoryRules: CategoryMappingRule[];
  onAddCategoryRule: (rule: CategoryMappingRule) => void;
  onRemoveCategoryRule: (id: string) => void;
  validationConfig: ValidationRulesConfig;
  onUpdateValidationConfig: (config: ValidationRulesConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  categoryRules,
  onAddCategoryRule,
  onRemoveCategoryRule,
  validationConfig,
  onUpdateValidationConfig,
}) => {
  // New rule input state
  const [newPattern, setNewPattern] = useState('');
  const [newTargetCat, setNewTargetCat] = useState<string>(STANDARD_CATEGORIES[0]);
  const [activeTab, setActiveTab] = useState<'categories' | 'validation' | 'roles' | 'templates'>('categories');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern.trim()) return;

    onAddCategoryRule({
      id: `rule-${Date.now()}`,
      pattern: newPattern.trim().toLowerCase(),
      targetCategory: newTargetCat,
    });

    setNewPattern('');
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b-2 border-[#171717] pb-3">
        {[
          { id: 'categories', label: 'Service Category Mappings', icon: Layers },
          { id: 'validation', label: 'Validation Rules Config', icon: ShieldAlert },
          { id: 'templates', label: 'VETport Templates & Dictionaries', icon: FileDown },
          { id: 'roles', label: 'Role Governance & Scope', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase border-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#F5E642] text-[#171717] border-[#171717] shadow-[2px_2px_0px_#171717]'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#171717]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CATEGORY MAPPING RULES */}
      {activeTab === 'categories' && (
        <NeoCard variant="white" className="p-5" shadowSize="md">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#171717] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#171717]" />
                Standard Service Category Normalization Rules
              </h2>
              <p className="text-[11px] text-neutral-500">
                Maps arbitrary raw VETport category inputs into the 5 authoritative reporting categories
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold bg-[#F5E642] px-2 py-0.5 border border-[#171717]">
              {categoryRules.length} Rules Active
            </span>
          </div>

          {/* Add New Rule Form */}
          <form onSubmit={handleAddRule} className="bg-[#FAF9F5] p-3.5 border-2 border-[#171717] mb-5">
            <span className="text-xs font-black uppercase text-[#171717] block mb-2">
              Add New Mapping Rule:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-0.5">
                  Raw Keyword Pattern (Case-Insensitive)
                </label>
                <input
                  type="text"
                  value={newPattern}
                  onChange={(e) => setNewPattern(e.target.value)}
                  placeholder="e.g. 'flea dip', 'dental polish', 'ultrasound'"
                  className="w-full bg-white border-2 border-[#171717] px-2.5 py-1.5 text-xs font-medium"
                />
              </div>

              <div className="w-60">
                <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-0.5">
                  Target Reporting Category
                </label>
                <select
                  value={newTargetCat}
                  onChange={(e) => setNewTargetCat(e.target.value)}
                  className="w-full bg-white border-2 border-[#171717] px-2.5 py-1.5 text-xs font-bold"
                >
                  {STANDARD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="self-end">
                <NeoButton variant="primary" size="sm" type="submit">
                  <Plus className="w-3.5 h-3.5" />
                  Add Rule
                </NeoButton>
              </div>
            </div>
          </form>

          {/* Existing Rules Table */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#171717] text-white uppercase font-black text-[10px] sticky top-0">
                <tr>
                  <th className="p-2 border-r border-neutral-700">Source Pattern / Keyword</th>
                  <th className="p-2 border-r border-neutral-700">Standard Category Assigned</th>
                  <th className="p-2 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody>
                {categoryRules.map((rule) => (
                  <tr key={rule.id} className="border-b border-neutral-300 bg-white hover:bg-[#FAF9F5]">
                    <td className="p-2 font-mono font-bold text-[#171717] border-r border-neutral-300">
                      "{rule.pattern}"
                    </td>
                    <td className="p-2 font-bold text-[#171717] border-r border-neutral-300">
                      {rule.targetCategory}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => onRemoveCategoryRule(rule.id)}
                        className="p-1 text-red-600 hover:bg-red-50 border border-neutral-300 cursor-pointer"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </NeoCard>
      )}

      {/* TAB 2: VALIDATION RULES CONFIG */}
      {activeTab === 'validation' && (
        <NeoCard variant="white" className="p-5" shadowSize="md">
          <div className="pb-3 border-b-2 border-[#171717] mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#171717]">
              Data Quality & Ingestion Validation Gates
            </h2>
            <p className="text-[11px] text-neutral-500">
              Configure strictness thresholds for flagging warnings and errors during spreadsheet ingestion
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 p-3 border-2 border-[#171717] bg-[#FAF9F5] cursor-pointer">
              <input
                type="checkbox"
                checked={validationConfig.flagZeroBilledAmount}
                onChange={(e) =>
                  onUpdateValidationConfig({
                    ...validationConfig,
                    flagZeroBilledAmount: e.target.checked,
                  })
                }
                className="w-4 h-4 mt-0.5 accent-[#171717]"
              />
              <div>
                <span className="font-bold text-[#171717] block">
                  Flag Zero-Value Service Lines as Informational Warnings
                </span>
                <span className="text-neutral-500 text-[11px]">
                  When checked, line items with ₹0 billed amount (e.g. complimentary checks) are preserved but flagged with an informational note rather than discarded.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border-2 border-[#171717] bg-[#FAF9F5] cursor-pointer">
              <input
                type="checkbox"
                checked={validationConfig.flagDuplicateServiceLines}
                onChange={(e) =>
                  onUpdateValidationConfig({
                    ...validationConfig,
                    flagDuplicateServiceLines: e.target.checked,
                  })
                }
                className="w-4 h-4 mt-0.5 accent-[#171717]"
              />
              <div>
                <span className="font-bold text-[#171717] block">
                  Duplicate Service Line Detection Across Invoices
                </span>
                <span className="text-neutral-500 text-[11px]">
                  Identifies multiple entries having identical Invoice Number, Plan Item Name, Performed Staff, Billed Amount, and Patient ID.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border-2 border-[#171717] bg-[#FAF9F5] cursor-pointer">
              <input
                type="checkbox"
                checked={validationConfig.flagUnmappedCategory}
                onChange={(e) =>
                  onUpdateValidationConfig({
                    ...validationConfig,
                    flagUnmappedCategory: e.target.checked,
                  })
                }
                className="w-4 h-4 mt-0.5 accent-[#171717]"
              />
              <div>
                <span className="font-bold text-[#171717] block">
                  Mandatory Flag for Unrecognized Service Categories
                </span>
                <span className="text-neutral-500 text-[11px]">
                  Requires unmapped source category values to be explicitly labeled as "Needs Review" rather than auto-converted into a generic category.
                </span>
              </div>
            </label>
          </div>
        </NeoCard>
      )}

      {/* TAB 3: TEMPLATES & DICTIONARIES */}
      {activeTab === 'templates' && (
        <NeoCard variant="white" className="p-5" shadowSize="md">
          <div className="pb-3 border-b-2 border-[#171717] mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#171717]">
              Authoritative VETport Column Schema & Download Templates
            </h2>
            <p className="text-[11px] text-neutral-500">
              Download clean standardized templates ready for hospital data entry and upload
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 border-2 border-[#171717] bg-[#FAF9F5]">
              <h3 className="font-black uppercase text-xs text-[#171717] mb-1">
                Standard Excel Template (.xlsx)
              </h3>
              <p className="text-xs text-neutral-600 mb-3">
                Pre-formatted with text formatting on Client ID, Patient ID, and Invoice No columns to avoid Excel stripping leading zeros.
              </p>
              <NeoButton
                variant="primary"
                size="sm"
                onClick={() => downloadVETportTemplate('xlsx')}
              >
                <FileDown className="w-3.5 h-3.5" />
                Download Excel (.xlsx)
              </NeoButton>
            </div>

            <div className="p-4 border-2 border-[#171717] bg-[#FAF9F5]">
              <h3 className="font-black uppercase text-xs text-[#171717] mb-1">
                Standard CSV Template (.csv)
              </h3>
              <p className="text-xs text-neutral-600 mb-3">
                UTF-8 comma-separated template containing the 12 official headers.
              </p>
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => downloadVETportTemplate('csv')}
              >
                <FileDown className="w-3.5 h-3.5" />
                Download CSV (.csv)
              </NeoButton>
            </div>
          </div>

          <div className="bg-white border-2 border-[#171717] p-3 text-xs">
            <span className="font-black uppercase text-[#171717] block mb-2">
              The 12 Authoritative VETport Columns Reference:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 font-mono text-[11px]">
              {[
                '1. Client Name',
                '2. Client ID',
                '3. Patient Name',
                '4. Patient ID',
                '5. Plan Item Name',
                '6. Plan Item Quantity',
                '7. Service Category',
                '8. Performed Staff',
                '9. Invoice Date',
                '10. Invoice No',
                '11. Billed Amount',
                '12. Branch',
              ].map((c) => (
                <div key={c} className="p-1.5 bg-[#FAF9F5] border border-neutral-300 font-bold">
                  {c}
                </div>
              ))}
            </div>
          </div>
        </NeoCard>
      )}

      {/* TAB 4: ROLE GOVERNANCE */}
      {activeTab === 'roles' && (
        <NeoCard variant="white" className="p-5" shadowSize="md">
          <div className="pb-3 border-b-2 border-[#171717] mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#171717]">
              Role Governance & Platform Scope Disclosure
            </h2>
            <p className="text-[11px] text-neutral-500">
              Transparency on session scope and security configuration
            </p>
          </div>

          <div className="space-y-4 text-xs text-neutral-700">
            <div className="p-3 bg-amber-50 border-2 border-amber-400">
              <span className="font-black uppercase text-amber-900 block mb-1">
                System Disclosure:
              </span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                In strict compliance with prompt governance rules, this application operates in client-side runtime session storage. While workflows are modeled for <strong>Hospital Admin</strong>, <strong>MIS Executive</strong>, and <strong>Senior Management</strong>, this installation does not claim enforced multi-user authentication or cryptographically isolated access controls without backend auth provisioning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 border-2 border-[#171717] bg-[#FAF9F5]">
                <span className="font-black uppercase text-[11px] text-[#171717] block mb-1">
                  1. MIS Executive View
                </span>
                <p className="text-[11px] text-neutral-600">
                  Responsible for uploading source Excel/CSV files, inspecting validation diagnostics, mapping columns, and exporting clean transformed files.
                </p>
              </div>

              <div className="p-3 border-2 border-[#171717] bg-[#FAF9F5]">
                <span className="font-black uppercase text-[11px] text-[#171717] block mb-1">
                  2. Hospital Admin View
                </span>
                <p className="text-[11px] text-neutral-600">
                  Maintains normalization dictionary rules, branch aliases, category mapping keywords, and validation thresholds.
                </p>
              </div>

              <div className="p-3 border-2 border-[#171717] bg-[#FAF9F5]">
                <span className="font-black uppercase text-[11px] text-[#171717] block mb-1">
                  3. Executive Management
                </span>
                <p className="text-[11px] text-neutral-600">
                  Consumes the high-level revenue KPI cards, provider rankings, branch contributions, and monthly billed revenue trends.
                </p>
              </div>
            </div>
          </div>
        </NeoCard>
      )}
    </div>
  );
};
