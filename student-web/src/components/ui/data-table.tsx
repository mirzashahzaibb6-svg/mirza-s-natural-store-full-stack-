import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({ columns, rows, rowKey }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-line">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-mute">
          <tr>{columns.map((c) => <th key={c.header} className="px-4 py-3 font-medium">{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-line/60 last:border-0">
              {columns.map((c) => <td key={c.header} className={`px-4 py-3 align-middle ${c.className ?? ''}`}>{c.cell(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
