import React, { useState, useMemo } from 'react';

interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortKey?: keyof T;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
}

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = 'Cari...',
  searchFilter,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    if (!query || !searchFilter) return data;
    return data.filter((row) => searchFilter(row, query));
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
        <div className="flex">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="bg-white border border-[#CCCCCC] focus:border-[#E67E22] focus:ring-2 focus:ring-[#E67E22] focus:outline-none rounded-lg px-4 py-2.5 text-xs text-[#333333] max-w-xs w-full transition-all"
            aria-label="Cari data"
          />
        </div>
      )}

      <div className="bg-white border border-[#CCCCCC] rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse" aria-label="Tabel Data">
          <thead>
            <tr className="border-b border-[#CCCCCC] bg-white text-xs text-[#E67E22] uppercase font-bold">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col.sortKey)}
                  className={`p-4 ${col.sortKey ? 'cursor-pointer select-none hover:text-[#D35400]' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
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
          <tbody className="divide-y divide-[#CCCCCC] text-xs text-[#333333]">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`transition-all duration-200 hover:scale-102 hover:shadow-md cursor-default ${
                    rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#F9F9F9]'
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="p-4">
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-slate-400 font-bold">
                  Data tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <nav className="flex justify-between items-center text-xs text-slate-500 font-bold" aria-label="Navigasi Paginasi">
          <div>
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} dari {sortedData.length} baris
          </div>
          <div className="flex gap-1.5 items-center">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white border border-[#CCCCCC] hover:bg-[#F5F5F5] disabled:opacity-50 disabled:hover:bg-white text-[#333333] rounded-lg transition-colors font-bold flex items-center justify-center focus:ring-2 focus:ring-[#E67E22] focus:outline-none"
              aria-label="Halaman sebelumnya"
            >
              &larr;
            </button>
            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-8 h-8 rounded-lg border font-bold transition-all flex items-center justify-center focus:ring-2 focus:ring-[#E67E22] focus:outline-none ${
                  currentPage === num
                    ? 'bg-[#E67E22] border-[#E67E22] text-white'
                    : 'bg-white border-[#CCCCCC] text-[#333333] hover:bg-[#F5F5F5]'
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
              className="px-3 py-2 bg-white border border-[#CCCCCC] hover:bg-[#F5F5F5] disabled:opacity-50 disabled:hover:bg-white text-[#333333] rounded-lg transition-colors font-bold flex items-center justify-center focus:ring-2 focus:ring-[#E67E22] focus:outline-none"
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
