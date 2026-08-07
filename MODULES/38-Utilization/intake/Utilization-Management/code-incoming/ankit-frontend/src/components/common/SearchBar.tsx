/**
 * Search Bar Component
 */

import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounce?: number;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  debounce = 300,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      if (timer) clearTimeout(timer);
      const newTimer = setTimeout(() => {
        onChange(newValue);
      }, debounce);
      setTimer(newTimer);
    },
    [onChange, debounce, timer]
  );

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    if (timer) clearTimeout(timer);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}