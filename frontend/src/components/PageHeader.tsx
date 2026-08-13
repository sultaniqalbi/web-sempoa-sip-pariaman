import React from 'react';
import { SheetsIcon, PlusIcon } from './SvgIcons';

export interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  iconColorBg?: string;
  onExportSheets?: () => void;
  isExporting?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  filterSearch?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  subtitle,
  iconColorBg = 'bg-[#FFF3E0] text-[#FF7043]',
  onExportSheets,
  isExporting = false,
  actionLabel,
  onAction,
  filterSearch,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-2 border-b border-[#E0E0E0]/60">
      {/* Left: 24px Icon + Title + Subtitle */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${iconColorBg}`}>
          {icon}
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#424242] tracking-tight">{title}</h1>
          <p className="text-xs text-[#757575] mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Middle & Right: Filter/Search + Secondary (Sheets) + Primary (Action) */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
        {filterSearch}

        {/* Secondary Action: Export to Google Sheets with 18px SVG SheetsIcon */}
        {onExportSheets && (
          <button
            onClick={onExportSheets}
            disabled={isExporting}
            className="px-3.5 py-2 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#FF7043] border border-[#FFCC80] rounded-[8px] text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs focus:outline-none disabled:opacity-50"
          >
            <SheetsIcon size={18} className="text-[#FF7043]" />
            <span>{isExporting ? 'Mengirim...' : 'Kirim ke Google Sheets'}</span>
          </button>
        )}

        {/* Primary Action Button in Homepage Primary Color #FF7043 */}
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="px-4 py-2 bg-[#FF7043] hover:bg-[#F4511E] text-white rounded-[8px] text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm focus:outline-none"
          >
            <PlusIcon size={14} className="text-white" />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
