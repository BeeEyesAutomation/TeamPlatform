import type { ReactNode } from "react";
import { EmptyState } from "./feedback";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  className?: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  items: T[];
  getRowKey: (item: T, index: number) => string;
  minWidth?: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({ columns, items, getRowKey, minWidth = 760, loading, emptyTitle, emptyDescription }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-md border border-border bg-white p-5 text-sm text-muted">
        Loading data...
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-white">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead className="bg-surface text-left text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`p-3 font-semibold ${column.className ?? ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={getRowKey(item, index)} className="border-t border-border align-top hover:bg-surface/70">
              {columns.map((column) => (
                <td key={column.key} className={`p-3 ${column.className ?? ""}`}>
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
