import React, { useRef, useState, useEffect } from 'react';
import { isoToDisplayDate, displayToIsoDate } from '../utils/dateFormatter';

interface DateInputProps {
  value: string; // ISO format "YYYY-MM-DD"
  onChange: (e: { target: { value: string } }) => void;
  className?: string;
  required?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  className = '',
  required = false,
  min,
  max,
  disabled = false,
  placeholder = 'HH/BB/TTTT',
  id,
  name,
}) => {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText(isoToDisplayDate(value));
  }, [value]);

  const openPicker = () => {
    if (disabled) return;
    if (hiddenInputRef.current) {
      try {
        if (typeof hiddenInputRef.current.showPicker === 'function') {
          hiddenInputRef.current.showPicker();
        } else {
          hiddenInputRef.current.focus();
        }
      } catch {
        hiddenInputRef.current.focus();
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayText(raw);

    // Otomatis deteksi format DD/MM/YYYY
    const parts = raw.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (d.length === 2 && m.length === 2 && y.length === 4) {
        const iso = `${y}-${m}-${d}`;
        onChange({ target: { value: iso } });
      }
    } else if (raw === '') {
      onChange({ target: { value: '' } });
    }
  };

  const handleBlur = () => {
    // Kembalikan ke format valid jika input tidak lengkap
    setDisplayText(isoToDisplayDate(value));
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        value={displayText}
        placeholder={placeholder}
        onChange={handleTextChange}
        onBlur={handleBlur}
        onClick={(e) => {
          // Jika diklik di icon kalender atau kosong, buka picker
          if (!displayText) {
            openPicker();
          }
        }}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={openPicker}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#FF7043] transition-colors cursor-pointer p-1"
        title="Buka Kalender"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {/* Hidden Native Date Input untuk Kalender Popup */}
      <input
        ref={hiddenInputRef}
        type="date"
        tabIndex={-1}
        min={min}
        max={max}
        value={value || ''}
        onChange={(e) => {
          const val = e.target.value;
          onChange({ target: { value: val } });
          setDisplayText(isoToDisplayDate(val));
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};

export default DateInput;
