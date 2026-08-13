import React from 'react';
import { InboxIcon, PlusIcon } from './SvgIcons';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'Belum ada data',
  description = 'Data tidak ditemukan atau belum pernah ditambahkan ke dalam sistem.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="p-10 md:p-14 text-center bg-white border border-[#E0E0E0] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.12)] flex flex-col items-center justify-center space-y-3">
      <div className="w-16 h-16 rounded-full bg-[#FAFAFA] border border-[#E0E0E0] flex items-center justify-center text-[#757575] mb-1">
        {icon || <InboxIcon size={40} className="text-[#757575]" />}
      </div>
      <h3 className="text-base font-bold text-[#424242]">{title}</h3>
      {description && <p className="text-xs text-[#757575] max-w-md leading-relaxed">{description}</p>}
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="mt-2 py-2 px-4 bg-[#FF7043] hover:bg-[#F4511E] text-white text-xs font-bold rounded-[8px] transition-colors shadow-sm inline-flex items-center gap-1.5 focus:outline-none"
        >
          <PlusIcon size={14} className="text-white" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
