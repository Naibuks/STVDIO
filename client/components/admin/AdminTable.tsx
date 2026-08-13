"use client";

/**
 * Responsive admin table.
 *
 * A wide table crushed into 375px is unreadable, so below `lg` each row
 * becomes a stacked card with its column headers as labels. Above `lg` it is a
 * real table, wrapped in its own overflow container so the page itself never
 * scrolls sideways.
 */
export type Column<T> = {
  key: string;
  header: string;
  /** Rendered in both the table cell and the mobile card. */
  render: (row: T) => React.ReactNode;
  /** Hide on the mobile card when the value is only useful in context. */
  hideOnMobile?: boolean;
};

export default function AdminTable<T extends { _id: string }>({
  rows,
  columns,
  loading,
  emptyMessage = "Nothing to show.",
  actions,
}: {
  rows: T[] | null;
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
}) {
  if (loading || rows === null) {
    return (
      <p className="border-t border-current/15 py-8 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="border-t border-current/15 py-8 font-mono text-xs uppercase tracking-widest text-current/40">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-current/15">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-3 py-3 text-left font-mono text-[0.6rem] font-normal uppercase tracking-widest text-current/40"
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th className="px-3 py-3 text-right font-mono text-[0.6rem] font-normal uppercase tracking-widest text-current/40">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id} className="border-b border-current/10">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-4 align-top">
                    {column.render(row)}
                  </td>
                ))}
                {actions && (
                  <td className="px-3 py-4 text-right align-top">
                    <div className="flex justify-end gap-2">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        {rows.map((row) => (
          <article key={row._id} className="border-b border-current/10 py-4">
            <dl className="space-y-2">
              {columns
                .filter((column) => !column.hideOnMobile)
                .map((column) => (
                  <div
                    key={column.key}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <dt className="shrink-0 font-mono text-[0.55rem] uppercase tracking-widest text-current/40">
                      {column.header}
                    </dt>
                    <dd className="min-w-0 text-right text-sm">
                      {column.render(row)}
                    </dd>
                  </div>
                ))}
            </dl>
            {actions && (
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {actions(row)}
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
