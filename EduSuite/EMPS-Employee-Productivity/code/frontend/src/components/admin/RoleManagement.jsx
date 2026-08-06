import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaEdit, FaSave, FaTimes, FaUserTag } from 'react-icons/fa';
import { employeeApi } from '../../api/employeeApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const RoleManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeApi.getAll();
      setEmployees(response.data || []);
    } catch (err) {
      setError('Failed to load employees');
      toast.error('Failed to load employees');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (employee) => {
    setEditingId(employee._id);
    setSelectedRole(employee.role);
  };

  const handleSaveRole = async (id) => {
    try {
      await employeeApi.assignRole(id, { role: selectedRole });
      toast.success('Role updated successfully');
      setEditingId(null);
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to update role');
      console.error('Update role error:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSelectedRole('');
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      hr: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      employee: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[role] || colors.employee;
  };

  const roleOptions = ['admin', 'hr', 'manager', 'employee'];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaShieldAlt className="text-indigo-600 dark:text-indigo-400 text-xl" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Role Management
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Employee</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Department</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Current Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                        {employee.firstName?.[0]}{employee.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{employee.employeeId}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {employee.department?.name || 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    {editingId === employee._id ? (
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        {roleOptions.map(role => (
                          <option key={role} value={role}>{role.toUpperCase()}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(employee.role)}`}>
                        {employee.role?.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingId === employee._id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSaveRole(employee._id)}
                          className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 transition-colors"
                        >
                          <FaSave size={14} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 transition-colors"
                        >
                          <FaTimes size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditRole(employee)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors"
                      >
                        <FaEdit size={12} />
                        <span>Edit Role</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {employees.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No employees found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;