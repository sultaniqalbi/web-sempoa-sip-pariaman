import React from 'react';

export type RangeOption = 'Hari Ini' | '7 Hari Terakhir' | '30 Hari Terakhir' | '3 Bulan Terakhir' | 'Pilih Tanggal Custom';

interface DateRangePickerProps {
  selectedRange: RangeOption;
  onChangeRange: (range: RangeOption) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  selectedRange,
  onChangeRange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}) => {
  const options: RangeOption[] = [
    'Hari Ini',
    '7 Hari Terakhir',
    '30 Hari Terakhir',
    '3 Bulan Terakhir',
    'Pilih Tanggal Custom',
  ];

  return (
    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 bg-white p-2.5 rounded-xl border border-[#E0E0E0] shadow-sm">
      <div className="relative w-full xl:w-auto">
        <select
          value={selectedRange}
          onChange={(e) => onChangeRange(e.target.value as RangeOption)}
          className="appearance-none bg-transparent w-full xl:w-48 pl-4 pr-10 py-2 text-sm font-bold text-[#424242] outline-none cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#757575]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {selectedRange === 'Pilih Tanggal Custom' && onCustomDateChange && (
        <div className="flex items-center gap-2 bg-[#F5F5F5] p-1.5 rounded-lg border border-[#E0E0E0] w-full xl:w-auto">
          <input
            type="date"
            value={customStartDate || ''}
            onChange={(e) => onCustomDateChange(e.target.value, customEndDate || '')}
            className="bg-transparent text-[#424242] text-xs font-mono outline-none px-2 w-full"
          />
          <span className="text-[#757575] font-bold">-</span>
          <input
            type="date"
            value={customEndDate || ''}
            onChange={(e) => onCustomDateChange(customStartDate || '', e.target.value)}
            className="bg-transparent text-[#424242] text-xs font-mono outline-none px-2 w-full"
          />
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
