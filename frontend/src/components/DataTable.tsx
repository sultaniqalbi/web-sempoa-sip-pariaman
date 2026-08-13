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
            className="bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 max-w-xs w-full transition-all"
            aria-label="Cari data"
          />
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse" aria-label="Tabel Data">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-xs text-amber-400 uppercase font-extrabold">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col.sortKey)}
                  className={`p-4 ${col.sortKey ? 'cursor-pointer select-none hover:text-amber-300' : ''}`}
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
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`transition-colors hover:bg-slate-800/40 cursor-default ${
                    rowIdx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'
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
                <td colSpan={columns.length} className="p-8 text-center text-slate-400 font-medium">
                  Data tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <nav className="flex justify-between items-center text-xs text-slate-400 font-medium" aria-label="Navigasi Paginasi">
          <div>
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} dari {sortedData.length} baris
          </div>
          <div className="flex gap-1.5 items-center">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white rounded-lg transition-colors font-bold flex items-center justify-center"
              aria-label="Halaman sebelumnya"
            >
              &larr;
            </button>
            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-8 h-8 rounded-lg border font-bold transition-all flex items-center justify-center ${
                  currentPage === num
                    ? 'bg-amber-500 border-amber-500 text-slate-950 font-extrabold shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
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
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white rounded-lg transition-colors font-bold flex items-center justify-center"
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
