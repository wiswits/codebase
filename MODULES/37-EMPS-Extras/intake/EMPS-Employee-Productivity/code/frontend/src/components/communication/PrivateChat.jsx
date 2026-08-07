import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUserCircle, FaComments } from 'react-icons/fa';
import { employeeApi } from '../../api/employeeApi';
import { chatApi } from '../../api/chatApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const PrivateChat = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeApi.getAll();
      setEmployees(response.data || []);
    } catch (error) {
      toast.error('Failed to load employees');
      console.error('Employees fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (employee) => {
    setCreating(true);
    try {
      const response = await chatApi.create({
        participants: [employee._id],
        type: 'private'
      });
      navigate(`/communication/${response.data._id}`);
    } catch (error) {
      toast.error('Failed to start chat');
      console.error('Create chat error:', error);
    } finally {
      setCreating(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName} ${emp.employeeId}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Start Private Chat
      </h3>

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaComments className="mx-auto text-3xl mb-2" />
            <p>No employees found</p>
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <div
              key={employee._id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
              onClick={() => handleStartChat(employee)}
            >
              <div className="flex items-center space-x-3">
                {employee.profilePhoto ? (
                  <img
                    src={employee.profilePhoto}
                    alt={employee.firstName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="text-gray-400 text-3xl" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {employee.employeeId} • {employee.position || 'Employee'}
                  </p>
                </div>
              </div>
              {creating && selectedEmployee?._id === employee._id ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-indigo-600"></div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartChat(employee);
                  }}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Chat
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PrivateChat;