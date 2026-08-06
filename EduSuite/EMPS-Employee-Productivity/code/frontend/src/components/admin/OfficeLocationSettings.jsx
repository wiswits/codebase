import React, { useState, useEffect } from 'react';
import { FaSave, FaMapMarkerAlt, FaRuler, FaBuilding, FaUndo } from 'react-icons/fa';
import { settingApi } from '../../api/settingApi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

const OfficeLocationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    latitude: 0,
    longitude: 0,
    radius: 50
  });

  useEffect(() => {
    fetchOfficeLocation();
  }, []);

  const fetchOfficeLocation = async () => {
    setLoading(true);
    try {
      const response = await settingApi.getOfficeLocation();
      if (response.success && response.data) {
        setFormData({
          latitude: response.data.latitude || 0,
          longitude: response.data.longitude || 0,
          radius: response.data.radius || 50
        });
      }
    } catch (error) {
      console.error('Fetch office location error:', error);
      toast.error('Failed to load office location settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingApi.updateOfficeLocation(formData);
      toast.success('Office location updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update office location');
      console.error('Update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      latitude: 0,
      longitude: 0,
      radius: 50
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FaBuilding className="text-indigo-600 dark:text-indigo-400 text-xl" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Office Location Settings
        </h2>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Note:</strong> These settings are used to verify employee location during check-in/out. 
          Employees must be within the specified radius to check in/out from the office.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FaMapMarkerAlt className="inline mr-1" /> Latitude *
            </label>
            <input
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              step="0.000001"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 28.6139"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Example: 28.6139 (New Delhi)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FaMapMarkerAlt className="inline mr-1" /> Longitude *
            </label>
            <input
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              step="0.000001"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 77.2090"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Example: 77.2090 (New Delhi)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FaRuler className="inline mr-1" /> Radius (meters) *
            </label>
            <input
              type="number"
              name="radius"
              value={formData.radius}
              onChange={handleChange}
              min="1"
              max="1000"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 50"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum allowed distance from office (default: 50 meters)
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Office Location Preview
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Latitude:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {formData.latitude || 'Not set'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Longitude:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {formData.longitude || 'Not set'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Radius:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {formData.radius || 'Not set'} meters
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <FaUndo />
            <span>Reset</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Save Office Location</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OfficeLocationSettings;