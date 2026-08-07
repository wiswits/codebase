export const Table = ({ columns, children }) => (
  <div className="overflow-x-auto -mx-2 sm:mx-0">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100">
          {columns.map((col) => (
            <th key={col} className="text-left font-semibold text-slate-500 px-3 py-3 whitespace-nowrap">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">{children}</tbody>
    </table>
  </div>
);

export const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-1 pt-4 text-sm text-slate-500">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="btn-secondary px-3 py-1.5 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="btn-secondary px-3 py-1.5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};
