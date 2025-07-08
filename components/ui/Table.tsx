
import React from 'react';
import { TableColumn } from '../../types';

interface TableProps<T,> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export const Table = <T extends object,>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No hay datos disponibles."
}: TableProps<T>): React.ReactElement => {
  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg bg-white dark:bg-slate-800">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
        <thead className="bg-gray-50 dark:bg-slate-700">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500 dark:text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr 
                key={keyExtractor(item)} 
                className={`${onRowClick ? 'hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((col) => (
                  <td key={`${String(col.key)}-${keyExtractor(item)}`} className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-300 ${col.className || ''}`}>
                    {col.render ? col.render(item) : (item[col.key as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};