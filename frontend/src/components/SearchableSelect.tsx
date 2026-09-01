import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, ChevronDownIcon, CloseIcon } from './SvgIcons';

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '-- Pilih --',
  searchPlaceholder = 'Ketik untuk mencari...',
  required = false,
  disabled = false,
  className = '',
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected Option Object
  const selectedOption = options.find(opt => opt.value === value);

  // Filtered options based on search query
  const filteredOptions = options.filter(opt => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[#1E293B] font-bold mb-1 text-xs">
          {label} {required && <span className="text-[#FF7043]">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left bg-[#F8FAFC] border rounded-xl p-2.5 text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs ${
          isOpen ? 'border-[#FF7043] ring-2 ring-[#FF7043]/20 bg-white' : 'border-[#CBD5E1] hover:border-[#94A3B8]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex-1 truncate">
          {selectedOption ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#0F172A] font-extrabold">{selectedOption.label}</span>
              {selectedOption.subLabel && (
                <span className="text-[#64748B] font-normal text-[11px] font-mono">({selectedOption.subLabel})</span>
              )}
              {selectedOption.badge && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FFF3E0] text-[#E65100] border border-[#FFE082]">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#94A3B8] font-normal">{placeholder}</span>
          )}
        </div>
        <ChevronDownIcon size={14} className={`text-[#64748B] transition-transform ${isOpen ? 'rotate-180 text-[#FF7043]' : ''}`} />
      </button>

      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="opacity-0 absolute inset-0 pointer-events-none h-0 w-0"
          tabIndex={-1}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#CBD5E1] rounded-xl shadow-xl overflow-hidden max-h-64 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box inside dropdown */}
          <div className="p-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="relative">
              <SearchIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] focus:border-[#FF7043] focus:outline-none placeholder:text-[#94A3B8]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] p-0.5"
                >
                  <CloseIcon size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 divide-y divide-[#F1F5F9] max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#94A3B8]">
                Tidak ada data yang cocok dengan "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF3E0] text-[#E65100] font-black'
                        : 'hover:bg-[#F8FAFC] text-[#1E293B]'
                    }`}
                  >
                    <div className="flex-1 truncate">
                      <p className="font-extrabold text-[#0F172A]">{opt.label}</p>
                      {opt.subLabel && (
                        <p className="text-[11px] text-[#64748B] font-mono">{opt.subLabel}</p>
                      )}
                    </div>
                    {opt.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] shrink-0">
                        {opt.badge}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
