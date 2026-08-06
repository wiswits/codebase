import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaBuilding } from 'react-icons/fa';
import { departmentApi } from '../../api/departmentApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data || []);
    } catch (err) {
      setError('Failed to load departments');
      toast.error('Failed to load departments');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await departmentApi.delete(id);
        toast.success('Department deleted successfully');
        fetchDepartments();
      } catch (error) {
        toast.error('Failed to delete department');
        console.error('Delete error:', error);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FaBuilding className="text-indigo-600 dark:text-indigo-400 text-xl" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Department Management
          </h2>
        </div>
        <button
          onClick={() => navigate('/admin/departments/create')}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaPlus />
          <span>Create Department</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div key={dept._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {dept.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{dept.code}</p>
                {dept.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{dept.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate(`/admin/departments/edit/${dept._id}`)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <FaEdit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(dept._id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Manager</span>
                <span className="text-gray-900 dark:text-white">
                  {dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : 'Not Assigned'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-500 dark:text-gray-400">Employees</span>
                <span className="text-gray-900 dark:text-white">{dept.employees?.length || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {departments.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No departments found</p>
          <p className="text-sm mt-1">Create your first department</p>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;