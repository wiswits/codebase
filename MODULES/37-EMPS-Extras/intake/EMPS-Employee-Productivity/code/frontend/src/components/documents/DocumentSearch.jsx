import React, { useState } from 'react';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

const DocumentSearch = ({ onSearch, onFilterChange, filters = {} }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...localFilters, [name]: value };
    setLocalFilters(newFilters);
    if (onFilterChange) onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { type: '', category: '', department: '' };
    setLocalFilters(emptyFilters);
    if (onFilterChange) onFilterChange(emptyFilters);
  };

  const documentTypes = [
    { value: '', label: 'All Types' },
    { value: 'company-policy', label: 'Company Policy' },
    { value: 'hr-policy', label: 'HR Policy' },
    { value: 'leave-policy', label: 'Leave Policy' },
    { value: 'code-of-conduct', label: 'Code of Conduct' },
    { value: 'nda', label: 'NDA' },
    { value: 'offer-letter', label: 'Offer Letter' },
    { value: 'salary-slip', label: 'Salary Slip' },
    { value: 'appointment-letter', label: 'Appointment Letter' },
    { value: 'other', label: 'Other' }
  ];

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'policy', label: 'Policy' },
    { value: 'hr', label: 'HR' },
    { value: 'legal', label: 'Legal' },
    { value: 'employee', label: 'Employee' },
    { value: 'financial', label: 'Financial' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 w-full">
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </form>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FaFilter />
          <span>Filters</span>
          {Object.values(localFilters).some(v => v) && (
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter Documents</h4>
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FaTimes size={12} />
              <span>Clear</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
              <select
                name="type"
                value={localFilters.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Category</label>
              <select
                name="category"
                value={localFilters.category}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Department</label>
              <input
                type="text"
                name="department"
                value={localFilters.department}
                onChange={handleFilterChange}
                placeholder="Department name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSearch;