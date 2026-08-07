import { useState, useMemo, useCallback } from 'react';

export const useSearch = (items, searchFields = []) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const term = searchTerm.toLowerCase().trim();
    return items.filter(item => {
      return searchFields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return String(value).toLowerCase().includes(term);
      });
    });
  }, [items, searchTerm, searchFields]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    filteredItems,
    handleSearch,
    clearSearch,
    hasResults: filteredItems.length > 0,
    resultCount: filteredItems.length
  };
};