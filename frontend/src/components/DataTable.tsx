import React, { useState, useMemo } from 'react';
import { SearchIcon } from './SvgIcons';

interface Column<T> {
  header: string | React.ReactNode;
  accessor: (row: T) => React.ReactNode;
  sortKey?: keyof T;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  isLoading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = 'Cari...',
  searchFilter,
  isLoading = false,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    if (!query || !searchFilter) return safeData;
    return safeData.filter((row) => searchFilter(row, query));
  }, [data, query, searchFilter]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB);
      }
      return valA < valB ? -1 : 1;
    });
    return sortOrder === 'desc' ? sorted.reverse() : sorted;
  }, [filteredData, sortKey, sortOrder]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Generate page numbers array (e.g. 1, 2, 3...)
  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  return (
    <div className="space-y-4">
      {searchFilter && (
        <div className="flex items-center gap-2 border border-[#E2E8F0] bg-[#F1F5F9] rounded-xl px-3 w-full max-w-xs focus-within:border-[#FF7043] focus-within:ring-1 focus-within:ring-[#FF7043] transition-colors">
          <span className="text-slate-400 shrink-0">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] outline-none"
            aria-label="Cari data"
          />
          {query && (
            <button onClick={() => { setQuery(''); setCurrentPage(1); }} className="text-[#94A3B8] hover:text-[#FF7043] font-bold p-1 cursor-pointer" title="Hapus pencarian">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[640px] text-left border-collapse" aria-label="Tabel Data">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#FF7043] uppercase font-extrabold">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    onClick={() => handleSort(col.sortKey)}
                    className={`p-3.5 sm:p-4 ${col.sortKey ? 'cursor-pointer select-none hover:text-[#F4511E]' : ''} ${col.className || ''}`}
                  >
                    <div className={`flex items-center gap-1.5 ${col.className?.includes('text-right') ? 'justify-end' : ''}`}>
                      {col.header}
                      {col.sortKey && (
                        <span className="text-[10px]" aria-hidden="true">
                          {sortKey === col.sortKey ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#1E293B]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse bg-white">
                    {columns.map((col, j) => (
                      <td key={j} className={`p-3.5 sm:p-4 ${col.className || ''}`}>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="hover:bg-[#F8FAFC] cursor-default bg-white"
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`p-3.5 sm:p-4 text-xs text-[#1E293B] ${col.className || ''}`}>
                        {col.accessor(row)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-8 text-center text-[#94A3B8]">
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      {!isLoading && totalPages > 1 && (
        <nav className="flex justify-between items-center text-xs text-[#94A3B8] font-medium" aria-label="Navigasi Paginasi">
          <div>
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} dari {sortedData.length} baris
          </div>
          <div className="flex gap-1.5 items-center">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] disabled:opacity-40 text-[#475569] rounded-lg font-bold flex items-center justify-center"
              aria-label="Halaman sebelumnya"
            >
              &larr;
            </button>
            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-8 h-8 rounded-lg border font-bold flex items-center justify-center ${
                  currentPage === num
                    ? 'bg-[#FF7043] border-[#FF7043] text-white font-extrabold shadow'
                    : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
                }`}
                aria-label={`Halaman ${num}`}
                aria-current={currentPage === num ? 'page' : undefined}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] disabled:opacity-40 text-[#475569] rounded-lg font-bold flex items-center justify-center"
              aria-label="Halaman berikutnya"
            >
              &rarr;
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

export default DataTable;
