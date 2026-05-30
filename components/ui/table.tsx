import React from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
};

export function Table<T extends { id: string }>({
  columns,
  rows,
  emptyState,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyState?: React.ReactNode;
}) {
  if (rows.length === 0) return emptyState ?? null;
  return (
    <div className="overflow-hidden rounded-[14px] border border-academy-line bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-academy-line bg-academy-mist">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className="px-5 py-3 text-left text-[12px] font-medium uppercase tracking-wide text-academy-slate"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-academy-line">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-academy-mist/40">
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-3.5 text-[13.5px] text-academy-navy">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
