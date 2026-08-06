import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaDownload, FaUser, FaCalendarAlt, FaBuilding, FaEnvelope } from 'react-icons/fa';
import { employeeApi } from '../../api/employeeApi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

const OfferLetterGeneration = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    position: '',
    department: '',
    startDate: '',
    salary: '',
    reportingManager: '',
    offerDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
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

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      position: employee.position || '',
      department: employee.department?.name || '',
      startDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
      salary: '',
      reportingManager: employee.manager?.firstName + ' ' + employee.manager?.lastName || '',
      offerDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // In a real implementation, this would call an API to generate the PDF
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock PDF download
      const content = `
        OFFER LETTER
        
        Date: ${formData.offerDate}
        
        Dear ${selectedEmployee?.firstName} ${selectedEmployee?.lastName},
        
        We are pleased to offer you the position of ${formData.position} in the ${formData.department} department.
        
        Start Date: ${formData.startDate}
        Salary: ${formData.salary}
        Reporting Manager: ${formData.reportingManager}
        
        Please sign and return this letter to confirm your acceptance.
        
        Sincerely,
        HR Department
      `;
      
      const blob = new Blob([content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Offer_Letter_${selectedEmployee?.employeeId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Offer letter generated successfully');
    } catch (error) {
      toast.error('Failed to generate offer letter');
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaFilePdf className="text-indigo-600 dark:text-indigo-400 text-xl" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Offer Letter Generation
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Select Employee</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {employees.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No pending employees</p>
            ) : (
              employees.map((emp) => (
                <button
                  key={emp._id}
                  onClick={() => handleSelectEmployee(emp)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedEmployee?._id === emp._id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent'
                  } border`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{emp.employeeId}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {selectedEmployee ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Offer Letter Details
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedEmployee.employeeId}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position *
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Salary (Annual) *
                  </label>
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="$50,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reporting Manager
                  </label>
                  <input
                    type="text"
                    name="reportingManager"
                    value={formData.reportingManager}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Offer Date
                  </label>
                  <input
                    type="date"
                    name="offerDate"
                    value={formData.offerDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FaDownload />
                      <span>Generate & Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaUser className="mx-auto text-4xl mb-2" />
              <p>Select an employee to generate offer letter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferLetterGeneration;