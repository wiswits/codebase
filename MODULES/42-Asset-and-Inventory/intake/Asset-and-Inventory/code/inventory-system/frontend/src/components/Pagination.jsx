import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;

  const pageNumbers = [];
  const maxShown = 5;
  let start = Math.max(1, page - Math.floor(maxShown / 2));
  let end = Math.min(pages, start + maxShown - 1);
  start = Math.max(1, end - maxShown + 1);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100">
      <p className="text-sm text-gray-400">
        Page {page} of {pages}
      </p>
      <div className="flex items-center gap-1">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        {pageNumbers.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${
              n === page ? "bg-brand-700 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {n}
          </button>
        ))}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
