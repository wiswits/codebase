/**
 * Batch Filter Component
 * Allows filtering alumni by batch
 */

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { alumniApi } from '../../services/alumniApi';

export default function BatchFilter({ selectedBatch, onBatchSelect, isLoading = false }) {
  const [batches, setBatches] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await alumniApi.getBatches();
      if (response.success) {
        setBatches(response.data.batches || []);
      } else {
        setError(response.error?.message || 'Failed to load batches');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (batch) => {
    onBatchSelect?.(batch);
    setIsOpen(false);
  };

  const handleClear = () => {
    onBatchSelect?.('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || loading}
        className={`
          w-full sm:w-auto inline-flex items-center justify-between px-4 py-2 border rounded-lg
          ${selectedBatch ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 bg-white text-gray-700'}
          hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          <span>
            {selectedBatch ? `Batch: ${selectedBatch}` : 'Filter by Batch'}
          </span>
        </div>
        <div className="flex items-center ml-2">
          {selectedBatch && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="mr-1 text-blue-500 hover:text-blue-700"
              aria-label="Clear batch filter"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="p-2">
            <button
              onClick={handleClear}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              All Batches
            </button>
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
            ) : error ? (
              <div className="px-3 py-2 text-sm text-red-500">{error}</div>
            ) : batches.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No batches found</div>
            ) : (
              batches.map((batch) => (
                <button
                  key={batch}
                  onClick={() => handleSelect(batch)}
                  className={`
                    w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                    ${selectedBatch === batch ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  Batch of {batch}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}