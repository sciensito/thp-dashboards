import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date';
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps {
  data: Record<string, unknown>[];
  columns: Column[];
  sortable?: boolean;
  maxRows?: number;
}

export function DataTable({
  data,
  columns,
  sortable = true,
  maxRows,
}: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const formatCell = (value: unknown, format?: Column['format']): string => {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Number(value));
      case 'percent':
        return `${Number(value).toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(value));
      case 'date':
        return new Date(String(value)).toLocaleDateString();
      default:
        return String(value);
    }
  };

  const handleSort = (key: string) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const comparison =
      typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const displayData = maxRows ? sortedData.slice(0, maxRows) : sortedData;

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`py-3 px-4 font-medium text-neutral-500 ${
                  column.align === 'right'
                    ? 'text-right'
                    : column.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${sortable ? 'cursor-pointer hover:text-neutral-700' : ''}`}
                onClick={() => handleSort(column.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {column.label}
                  {sortable && sortKey === column.key && (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-neutral-100 hover:bg-neutral-50"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`py-3 px-4 text-neutral-900 ${
                    column.align === 'right'
                      ? 'text-right'
                      : column.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {formatCell(row[column.key], column.format)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {maxRows && data.length > maxRows && (
        <div className="py-2 px-4 text-sm text-neutral-500 text-center border-t border-neutral-100">
          Showing {maxRows} of {data.length} rows
        </div>
      )}
    </div>
  );
}
