import React from 'react';
import { Menu, UploadCloud, FileDown, ShieldCheck } from 'lucide-react';
import { NeoButton } from '../common/NeoButton';
import { downloadVETportTemplate } from '../../utils/exporter';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigateUpload: () => void;
  activeTabLabel: string;
  lastImportTime?: string;
  totalRecordsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNavigateUpload,
  activeTabLabel,
  lastImportTime,
  totalRecordsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F7F5EF] border-b-[3px] border-[#171717] px-4 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Hamburger & View Titles */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 bg-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] hover:bg-[#F5E642] cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5 text-[#171717]" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#171717]">
                PROVIDER & SERVICE MIS
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-black uppercase bg-[#171717] text-[#F5E642]">
                VETport Engine
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 mt-0.5">
              <span>View:</span>
              <span className="font-extrabold uppercase text-[#171717] underline decoration-[#F5E642] decoration-4">
                {activeTabLabel}
              </span>
              <span className="text-neutral-400">|</span>
              <span className="font-mono text-[11px] text-neutral-500">
                {totalRecordsCount} records active
              </span>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Template download quick button */}
          <button
            onClick={() => downloadVETportTemplate('xlsx')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-white hover:bg-neutral-100 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] cursor-pointer text-[#171717]"
            title="Download blank VETport 12-column Excel template"
          >
            <FileDown className="w-3.5 h-3.5 text-[#171717]" />
            Template (.xlsx)
          </button>

          {/* Upload Data button */}
          <NeoButton
            variant="primary"
            size="sm"
            onClick={onNavigateUpload}
            className="flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4 text-[#171717]" />
            <span>Upload Data</span>
          </NeoButton>
        </div>
      </div>
    </header>
  );
};
