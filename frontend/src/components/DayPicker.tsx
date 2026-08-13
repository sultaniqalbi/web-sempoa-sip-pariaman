import React from 'react';

interface DayPickerProps {
  label?: string;
  selectedDays: string | string[];
  onChange: (value: string) => void;
  multiSelect?: boolean;
  required?: boolean;
  error?: string | null;
}

const ALL_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const DayPicker: React.FC<DayPickerProps> = ({
  label = 'Hari*',
  selectedDays,
  onChange,
  multiSelect = true,
  required = false,
  error = null,
}) => {
  // Normalize selectedDays into an array of strings
  const getSelectedArray = (): string[] => {
    if (!selectedDays) return [];
    if (Array.isArray(selectedDays)) return selectedDays;
    return selectedDays
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
  };

  const selectedList = getSelectedArray();

  const handleToggle = (day: string) => {
    if (multiSelect) {
      let updated: string[];
      if (selectedList.includes(day)) {
        updated = selectedList.filter((d) => d !== day);
      } else {
        // Keep standard order
        updated = ALL_DAYS.filter((d) => selectedList.includes(d) || d === day);
      }
      onChange(updated.join(', '));
    } else {
      onChange(day);
    }
  };

  return (
    <div>
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-[#1E293B] font-bold text-xs">
            {label} {required && <span className="text-[#D32F2F]">*</span>}
          </label>
          <span className="text-[10px] text-[#64748B]">
            {multiSelect ? 'Multi-pilih' : 'Pilih 1 hari'}
          </span>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {ALL_DAYS.map((day) => {
          const isSelected = multiSelect
            ? selectedList.includes(day)
            : selectedDays === day;

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleToggle(day)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer border ${
                isSelected
                  ? 'bg-[#FF7043] text-white border-[#FF7043] shadow-xs scale-[1.02]'
                  : 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0] hover:bg-[#E2E8F0] hover:text-[#1E293B]'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      {error && <p className="text-[11px] text-[#D32F2F] font-semibold mt-1">{error}</p>}
    </div>
  );
};

export default DayPicker;
