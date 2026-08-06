import React, { useState, useEffect } from 'react';
import { FaFileInvoice, FaDownload, FaSearch, FaCalendarAlt, FaUser } from 'react-icons/fa';
import { employeeApi } from '../../api/employeeApi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

const SalarySlipGeneration = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeApi.getAll();
      setEmployees(response.data || []);
    } catch (error) {
      toast.error('Failed to load employees');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedEmployee) {
      toast.warning('Please select an employee');
      return;
    }

    setGenerating(true);
    try {
      // In a real implementation, this would call an API to generate the PDF
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const content = `
        SALARY SLIP
        
        Employee: ${selectedEmployee.firstName} ${selectedEmployee.lastName}
        Employee ID: ${selectedEmployee.employeeId}
        Department: ${selectedEmployee.department?.name || 'N/A'}
        Position: ${selectedEmployee.position || 'N/A'}
        
        Period: ${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}
        
        Earnings:
        - Basic Salary: $3,000
        - Allowances: $1,000
        - Bonus: $500
        
        Deductions:
        - Tax: $450
        - Insurance: $150
        
        Net Pay: $3,900
      `;
      
      const blob = new Blob([content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Salary_Slip_${selectedEmployee.employeeId}_${month+1}_${year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Salary slip generated successfully');
    } catch (error) {
      toast.error('Failed to generate salary slip');
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName} ${emp.employeeId}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaFileInvoice className="text-indigo-600 dark:text-indigo-400 text-xl" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Salary Slip Generation
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Select Employee</h3>
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
            {filteredEmployees.map((emp) => (
              <button
                key={emp._id}
                onClick={() => setSelectedEmployee(emp)}
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
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {selectedEmployee ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Salary Slip Details
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedEmployee.employeeId}
                </span>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                <div className="flex items-center space-x-3">
                  <FaUser className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedEmployee.position || 'Employee'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Month *
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Year *
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
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
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaUser className="mx-auto text-4xl mb-2" />
              <p>Select an employee to generate salary slip</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalarySlipGeneration;