import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  TableProperties,
  UserCheck,
  Layers,
  CalendarDays,
  History,
  Sliders,
  X,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  totalRecordsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpen,
  onClose,
  totalRecordsCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Data', icon: UploadCloud, badge: 'VETport' },
    { id: 'detailed', label: 'Detailed MIS', icon: TableProperties, count: totalRecordsCount },
    { id: 'providers', label: 'Provider Performance', icon: UserCheck },
    { id: 'categories', label: 'Service Category Report', icon: Layers },
    { id: 'monthly', label: 'Monthly MIS', icon: CalendarDays },
    { id: 'history', label: 'Import History', icon: History },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#171717]/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#F7F5EF]
          border-r-[3px] border-[#171717] flex flex-col justify-between
          transition-transform duration-200 ease-in-out
          lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div>
          {/* Brand header */}
          <div className="p-5 border-b-[3px] border-[#171717] bg-[#F5E642] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#171717] text-[#F5E642] flex items-center justify-center font-black text-xl border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight uppercase leading-none text-[#171717]">
                  VETport MIS
                </h1>
                <p className="text-[11px] font-bold text-neutral-800 tracking-wider uppercase mt-0.5">
                  Provider & Service Revenue
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden p-1 border-2 border-[#171717] bg-white hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-4 h-4 text-[#171717]" />
            </button>
          </div>

          {/* Source System Badge */}
          <div className="px-5 py-2.5 bg-white border-b-2 border-[#171717] flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-600 uppercase text-[10px] tracking-widest flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#171717]" />
              Data Source
            </span>
            <span className="font-mono font-bold text-[11px] text-[#171717] px-1.5 py-0.5 bg-[#F5E642] border border-[#171717]">
              VETport 12-Col
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider
                    border-2 transition-all cursor-pointer select-none text-left
                    ${
                      isActive
                        ? 'bg-[#F5E642] text-[#171717] border-[#171717] shadow-[3px_3px_0px_#171717] translate-x-0.5 font-extrabold'
                        : 'bg-white text-neutral-800 border-transparent hover:border-[#171717] hover:bg-neutral-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#171717] shrink-0" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#5278FF] text-white border border-[#171717]">
                      {item.badge}
                    </span>
                  )}

                  {item.count !== undefined && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-neutral-200 text-neutral-800 border border-neutral-400">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System & Session status footer */}
        <div className="p-4 border-t-[3px] border-[#171717] bg-white text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[10px] uppercase text-neutral-500">Storage Scope</span>
            <span className="font-mono text-[10px] font-bold text-neutral-700">Browser Session</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-[10px] uppercase text-neutral-500">Fiscal Year</span>
            <span className="font-mono text-[10px] font-bold text-neutral-900">FY 2026-27</span>
          </div>
          <div className="mt-3 pt-2 border-t border-neutral-200 text-[10px] text-neutral-500 leading-tight">
            Revenue = Sum of line totals. Never multiplied by quantity.
          </div>
        </div>
      </aside>
    </>
  );
};
