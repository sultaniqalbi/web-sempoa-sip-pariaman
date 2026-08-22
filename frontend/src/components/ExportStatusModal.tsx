import React from 'react';
import Modal from './Modal';

export interface ExportStatusResult {
  status: 'success' | 'error' | 'pending';
  message: string;
  worksheet_name?: string;
  rows_written?: number;
  sheet_url?: string;
}

interface ExportStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ExportStatusResult | null;
  defaultSheetUrl?: string;
}

export const ExportStatusModal: React.FC<ExportStatusModalProps> = ({
  isOpen,
  onClose,
  result,
  defaultSheetUrl = 'https://docs.google.com/spreadsheets/d/1C9m90ipD2mt_pmWK5pNQ_YxfzwRbWZOlLYAXMtzMYKA/edit',
}) => {
  if (!isOpen || !result) return null;

  const targetUrl =
    result.sheet_url && !result.sheet_url.includes('script.google.com')
      ? result.sheet_url
      : defaultSheetUrl;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Status Google Sheets Export" size="sm">
      <div className="space-y-4 text-xs">
        <p className="text-[#1E293B] font-bold text-sm leading-relaxed">
          {result.message}
        </p>

        {result.status === 'success' ? (
          <div className="space-y-3 pt-1">
            {result.worksheet_name && (
              <p className="text-[#475569]">
                Tab: <code className="text-[#FF7043] font-bold bg-[#FFF3E0] px-2 py-0.5 rounded">{result.worksheet_name}</code>{' '}
                {result.rows_written !== undefined && `(${result.rows_written} baris ditulis)`}
              </p>
            )}
            <div>
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
                </svg>
                <span>Buka Google Sheets</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-[#FFF3E0] border border-[#FFCC80] rounded-xl text-[#E65100] text-xs space-y-1">
            <p className="font-bold">Gagal sinkronisasi:</p>
            <p>{result.message}</p>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-[#F1F5F9]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-xl border border-[#CBD5E1] transition-colors cursor-pointer active:scale-95 text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportStatusModal;
