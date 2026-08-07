import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaUserCheck, FaFileAlt, FaSearch } from 'react-icons/fa';
import { employeeApi } from '../../api/employeeApi';
import { documentApi } from '../../api/documentApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const EmployeeVerification = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeApi.getAll({ isVerified: false });
      setEmployees(response.data || []);
    } catch (error) {
      toast.error('Failed to load employees');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDocuments = async (employeeId) => {
    try {
      const response = await documentApi.getEmployeeDocs(employeeId);
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Fetch documents error:', error);
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    fetchEmployeeDocuments(employee._id);
    setVerificationNotes('');
  };

  const handleVerify = async (status) => {
    if (!selectedEmployee) return;

    try {
      await employeeApi.update(selectedEmployee._id, {
        isVerified: status === 'verified',
        verificationNotes: verificationNotes
      });
      toast.success(`Employee ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to update verification status');
      console.error('Verification error:', error);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName} ${emp.employeeId}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaUserCheck className="text-indigo-600 dark:text-indigo-400 text-xl" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Employee Verification
          </h2>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {employees.length} pending verifications
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pending Verifications</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <FaCheckCircle className="mx-auto text-3xl text-green-500 mb-2" />
                <p>No pending verifications</p>
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <div
                  key={emp._id}
                  onClick={() => handleSelectEmployee(emp)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedEmployee?._id === emp._id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {emp.employeeId} • {emp.position || 'Employee'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {emp.department?.name || 'No Department'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {selectedEmployee ? (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedEmployee.employeeId} • {selectedEmployee.email}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Position</span>
                  <span className="text-gray-900 dark:text-white">{selectedEmployee.position || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Department</span>
                  <span className="text-gray-900 dark:text-white">{selectedEmployee.department?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Joined</span>
                  <span className="text-gray-900 dark:text-white">
                    {selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documents ({documents.length})
                </h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {documents.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded</p>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc._id} className="flex items-center space-x-2 text-sm">
                        <FaFileAlt className="text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{doc.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Verification Notes
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder="Add notes about verification..."
                />
              </div>

              <div className="flex items-center space-x-3 mt-4">
                <button
                  onClick={() => handleVerify('verified')}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1 justify-center"
                >
                  <FaCheckCircle />
                  <span>Verify</span>
                </button>
                <button
                  onClick={() => handleVerify('rejected')}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-1 justify-center"
                >
                  <FaTimesCircle />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaUserCheck className="mx-auto text-4xl mb-2" />
              <p>Select an employee to verify</p>
              <p className="text-sm mt-1">Click on an employee from the list</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeVerification;