import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export const Modal = ({ open, onClose, title, children, width = 'max-w-lg' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${width} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export const Pagination = ({ page, pages, onChange }) => {
  if (!pages || pages <= 1) return null;
  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1).slice(0, 6);
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs text-gray-500">
        Page {page} of {pages}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="p-1.5 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
        >
          <ChevronLeft size={15} />
        </button>
        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-8 w-8 rounded-md text-xs font-medium ${
              p === page ? 'bg-blue-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
            }`}
          >
            {p}
          </button>
        ))}
        {pages > 6 && <span className="text-gray-400 text-xs px-1">...</span>}
        <button
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="p-1.5 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};
