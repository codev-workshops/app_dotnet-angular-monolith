import React from 'react';

interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowClassName?: (row: T) => string | undefined;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  rows,
  rowClassName,
  emptyMessage = 'No data available.',
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className={rowClassName?.(row) ?? undefined}>
            {columns.map((col, colIndex) => (
              <td key={colIndex}>{col.accessor(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
