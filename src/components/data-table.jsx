"use client";

import { useMemo, useState } from "react";

function defaultCellValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
}

export function DataTable({
  columns,
  data,
  rowKey,
  searchPlaceholder = "ค้นหา...",
  searchKeys = [],
  pageSizeOptions = [10, 20, 50],
  initialPageSize = 10,
  emptyText = "ไม่พบข้อมูล",
}) {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) {
      return data;
    }

    return data.filter((row) => {
      const keys = searchKeys.length > 0
        ? searchKeys
        : columns.map((column) => column.id).filter(Boolean);

      return keys.some((key) => {
        const value = row?.[key];
        if (value === null || value === undefined) {
          return false;
        }
        return String(value).toLowerCase().includes(normalizedQuery);
      });
    });
  }, [columns, data, normalizedQuery, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  const pagedRows = useMemo(
    () => filtered.slice(startIndex, startIndex + pageSize),
    [filtered, startIndex, pageSize]
  );

  const onChangePageSize = (value) => {
    const nextSize = Number(value);
    setPageSize(nextSize);
    setPage(1);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none sm:max-w-sm"
        />

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>แถวต่อหน้า</span>
          <select
            value={pageSize}
            onChange={(e) => onChangePageSize(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              {columns.map((column) => (
                <th key={column.id || column.header} className={`px-4 py-3 ${column.headerClassName || ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              pagedRows.map((row, rowIndex) => (
                <tr key={rowKey ? rowKey(row, rowIndex) : rowIndex} className="transition hover:bg-gray-50">
                  {columns.map((column) => {
                    const content = column.cell
                      ? column.cell(row, rowIndex)
                      : defaultCellValue(column.accessor ? column.accessor(row) : row?.[column.id]);

                    return (
                      <td key={column.id || column.header} className={`px-4 py-3 ${column.cellClassName || ""}`}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
        <p>
          แสดง {filtered.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} จาก {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            ก่อนหน้า
          </button>
          <span className="text-xs">{currentPage}/{totalPages}</span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
