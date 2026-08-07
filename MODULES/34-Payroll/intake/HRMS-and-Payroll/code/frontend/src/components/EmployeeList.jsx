// frontend/src/components/EmployeeList.jsx
import { useState, useEffect } from 'react';
import Skeleton, { SkeletonRow } from './Skeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import { useToast } from '../context/ToastContext';

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/v1/employees');
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      setEmployees(data.data || []);
    } catch (err) {
      setError('Failed to load employees. Please try again.');
      showToast('❌ Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Delete employee
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/v1/employees/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showToast('✅ Employee deleted successfully!', 'success');
        fetchEmployees();
      }
    } catch (err) {
      showToast('❌ Failed to delete employee', 'error');
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">👥 Employee List</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonRow key={i} cols={5} />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={fetchEmployees} />
      </div>
    );
  }

  // Empty State
  if (employees.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon="👥"
          title="No Employees Yet"
          description="Start by adding your first employee to the system."
          actionText="+ Add Employee"
          onAction={() => {
            const addBtn = document.querySelector('[data-add-employee]');
            if (addBtn) addBtn.click();
          }}
        />
      </div>
    );
  }

  // Data Table
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">👥 Employee List</h2>
        <button 
          data-add-employee
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Employee
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">{emp.employee_code}</td>
                <td className="px-6 py-4 font-medium text-gray-800">
                  {emp.first_name} {emp.last_name || ''}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{emp.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{emp.department || '-'}</td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm mr-3">
                    View
                  </button>
                  <button 
                    onClick={() => handleDelete(emp.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeeList;