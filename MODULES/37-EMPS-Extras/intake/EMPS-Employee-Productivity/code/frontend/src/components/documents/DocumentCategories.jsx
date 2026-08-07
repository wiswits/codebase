import React, { useState, useEffect } from 'react';
import { FaFolder, FaFolderOpen, FaFileAlt, FaCheck } from 'react-icons/fa';
import { documentApi } from '../../api/documentApi';
import LoadingSpinner from '../common/LoadingSpinner';

const DocumentCategories = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await documentApi.getAll();
      const docs = response.data || [];
      
      const categoryCounts = docs.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      }, {});

      const categoryLabels = {
        policy: 'Policies',
        hr: 'HR Documents',
        legal: 'Legal Documents',
        employee: 'Employee Documents',
        financial: 'Financial Documents'
      };

      const categoryIcons = {
        policy: '📋',
        hr: '👔',
        legal: '⚖️',
        employee: '👤',
        financial: '💰'
      };

      const categoryList = Object.entries(categoryCounts).map(([key, count]) => ({
        key,
        label: categoryLabels[key] || key,
        icon: categoryIcons[key] || '📁',
        count
      }));

      setCategories(categoryList);
    } catch (error) {
      console.error('Fetch categories error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (category) => {
    setSelectedCategory(category);
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Categories
      </h4>
      <div className="space-y-2">
        <button
          onClick={() => handleSelect(null)}
          className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
            selectedCategory === null
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <span className="flex items-center space-x-2">
            <FaFolderOpen />
            <span className="text-sm">All Documents</span>
          </span>
          <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
            {categories.reduce((sum, cat) => sum + cat.count, 0)}
          </span>
        </button>

        {categories.map((category) => (
          <button
            key={category.key}
            onClick={() => handleSelect(category.key)}
            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
              selectedCategory === category.key
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <span className="flex items-center space-x-2">
              <span className="text-lg">{category.icon}</span>
              <span className="text-sm">{category.label}</span>
            </span>
            <span className="flex items-center space-x-2">
              <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                {category.count}
              </span>
              {selectedCategory === category.key && (
                <FaCheck className="text-indigo-600 dark:text-indigo-400 text-xs" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DocumentCategories;