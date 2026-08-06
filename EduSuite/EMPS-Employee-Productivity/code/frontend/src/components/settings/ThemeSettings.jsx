import React, { useState } from 'react';
import { FaPalette, FaSun, FaMoon, FaDesktop, FaCheck } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-toastify';

const ThemeSettings = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme || 'light');
  const [loading, setLoading] = useState(false);

  const themes = [
    { id: 'light', name: 'Light', icon: FaSun, description: 'Light mode for day use' },
    { id: 'dark', name: 'Dark', icon: FaMoon, description: 'Dark mode for night use' },
    { id: 'system', name: 'System', icon: FaDesktop, description: 'Follow system preference' }
  ];

  const handleThemeSelect = async (themeId) => {
    setSelectedTheme(themeId);
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTheme(themeId);
      toast.success(`Theme changed to ${themeId}`);
    } catch (error) {
      toast.error('Failed to change theme');
      console.error('Theme change error:', error);
    } finally {
      setLoading(false);
    }
  };

  const colorSchemes = [
    { id: 'indigo', name: 'Indigo', color: '#4F46E5' },
    { id: 'blue', name: 'Blue', color: '#3B82F6' },
    { id: 'purple', name: 'Purple', color: '#8B5CF6' },
    { id: 'pink', name: 'Pink', color: '#EC4899' },
    { id: 'red', name: 'Red', color: '#EF4444' },
    { id: 'green', name: 'Green', color: '#10B981' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FaPalette className="text-indigo-600 dark:text-indigo-400 text-xl" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Theme Settings
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Theme Mode
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeSelect(t.id)}
                  disabled={loading}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`text-2xl ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                    {isSelected && <FaCheck className="text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Primary Color
          </h3>
          <div className="flex flex-wrap gap-3">
            {colorSchemes.map((color) => (
              <button
                key={color.id}
                className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 transition-colors flex items-center justify-center"
                style={{ backgroundColor: color.color }}
                title={color.name}
              >
                <span className="sr-only">{color.name}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Select a primary color scheme (applies throughout the application)
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preview
          </h3>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              Primary
            </div>
            <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-bold">
              Secondary
            </div>
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-xs font-bold ${
              theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}>
              Background
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;