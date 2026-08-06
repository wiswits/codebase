// frontend/src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import AddEmployeeForm from './AddEmployeeForm';
import LeaveApply from './LeaveApply';
import EmployeeDetail from './EmployeeDetail';
import Reports from './Reports';
import Payroll from './Payroll';
import Profile from './Profile';
import ExpenseClaims from './ExpenseClaims';
import EmailNotifications from './EmailNotifications';
import Notifications from './Notifications';
import Attendance from './Attendance';
import Onboarding from './Onboarding';
import Recruitment from './Recruitment';
import LearningManagement from './LearningManagement';
import Support from './Support';
import Rewards from './Rewards';
import AssetManagement from './AssetManagement';
import HolidayManagement from './HolidayManagement';
import { useTheme } from '../context/ThemeContext';

const API_URL = 'http://localhost:5000';

function Dashboard({ user, onLogout }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats] = useState({
    employees: 0,
    leaves: 0,
    attendance: 0,
    pendingApprovals: 0
  });

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/employees`);
      const data = await response.json();
      setEmployees(data.data || []);
      setStats(prev => ({ ...prev, employees: data.data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    setStats(prev => ({
      ...prev,
      leaves: 12,
      attendance: 89,
      pendingApprovals: 5
    }));
  }, []);

  const handleAddSuccess = () => {
    fetchEmployees();
  };

  const handleLeaveSuccess = () => {
    alert('✅ Leave request submitted!');
  };

  const firstEmployeeId = employees.length > 0 ? employees[0].id : 1;

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-3 rounded-xl">
              <span className="text-xl sm:text-2xl">👥</span>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Total Employees</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{stats.employees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 sm:p-3 rounded-xl">
              <span className="text-xl sm:text-2xl">📋</span>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Leave Requests</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{stats.leaves}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 sm:p-3 rounded-xl">
              <span className="text-xl sm:text-2xl">📍</span>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Today's Attendance</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{stats.attendance}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 sm:p-3 rounded-xl">
              <span className="text-xl sm:text-2xl">⏳</span>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Pending Approvals</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm mb-6">
        <h2 className="font-bold text-gray-800 dark:text-white mb-4 text-sm sm:text-base">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-17 gap-2 sm:gap-4">
          <button onClick={() => setShowAddForm(true)} className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">➕</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Add Employee</span>
          </button>
          <button onClick={() => setShowLeaveForm(true)} className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">📅</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Apply Leave</span>
          </button>
          <button onClick={() => setCurrentPage('payroll')} className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">📊</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Payroll</span>
          </button>
          <button onClick={() => setCurrentPage('reports')} className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">📄</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Reports</span>
          </button>
          <button onClick={() => setCurrentPage('profile')} className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">👤</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Profile</span>
          </button>
          <button onClick={() => setCurrentPage('expenses')} className="p-3 sm:p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">💳</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Expenses</span>
          </button>
          <button onClick={() => setCurrentPage('email')} className="p-3 sm:p-4 bg-pink-50 dark:bg-pink-900/30 rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">📧</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Email</span>
          </button>
          <button onClick={() => setCurrentPage('attendance')} className="p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">📍</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Attendance</span>
          </button>
          <button onClick={() => setCurrentPage('onboarding')} className="p-3 sm:p-4 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">🚀</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Onboarding</span>
          </button>
          <button onClick={() => setCurrentPage('recruitment')} className="p-3 sm:p-4 bg-rose-50 dark:bg-rose-900/30 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">🎯</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Recruitment</span>
          </button>
          <button onClick={() => setCurrentPage('learning')} className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">📚</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Learning</span>
          </button>
          <button onClick={() => setCurrentPage('support')} className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">💬</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Support</span>
          </button>
          <button onClick={() => setCurrentPage('rewards')} className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">🏆</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Rewards</span>
          </button>
          <button onClick={() => setCurrentPage('assets')} className="p-3 sm:p-4 bg-sky-50 dark:bg-sky-900/30 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">💻</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Assets</span>
          </button>
          <button onClick={() => setCurrentPage('holidays')} className="p-3 sm:p-4 bg-fuchsia-50 dark:bg-fuchsia-900/30 rounded-xl hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">🎉</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Holidays</span>
          </button>
          <button className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-center">
            <div className="text-xl sm:text-2xl mb-1">⚙️</div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Settings</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
          <h2 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">👥 Employee Management</h2>
          <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition-colors flex items-center gap-1 w-full sm:w-auto justify-center">
            <span>➕</span> Add Employee
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm sm:text-base">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm sm:text-base">No employees yet. Click "Add Employee" to get started!</div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full min-w-[500px] sm:min-w-[600px]">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Code</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden sm:table-cell">Email</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden md:table-cell">Department</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">{emp.employee_code}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-800 dark:text-white">
                        {emp.first_name} {emp.last_name || ''}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">{emp.email}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">{emp.department || '-'}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <button onClick={() => setSelectedEmployee(emp.id)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs sm:text-sm">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🏢</span>
            <span className="font-bold text-gray-800 dark:text-white text-sm sm:text-base hidden xs:inline">HRMS Portal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <Notifications userId={1} />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">👋 Welcome, {user?.name || 'Admin'}!</span>
            <button onClick={toggleDarkMode} className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              {darkMode ? '☀️' : '🌙'}
            </button>
            {currentPage !== 'dashboard' && (
              <button onClick={() => setCurrentPage('dashboard')} className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs sm:text-sm hover:bg-blue-200 dark:hover:bg-blue-800">← Back</button>
            )}
            <button onClick={onLogout} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 text-white rounded-lg text-xs sm:text-sm hover:bg-red-600 transition-colors">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {currentPage === 'dashboard' && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white mb-6 sm:mb-8">
            <h1 className="text-lg sm:text-2xl font-bold">Welcome back, {user?.name || 'Admin'}! 👋</h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">Here's what's happening with your organization today.</p>
          </div>
        )}

        {currentPage === 'dashboard' && renderDashboard()}
        {currentPage === 'reports' && <Reports />}
        {currentPage === 'payroll' && <Payroll />}
        {currentPage === 'profile' && <Profile user={user} />}
        {currentPage === 'expenses' && <ExpenseClaims employeeId={firstEmployeeId} />}
        {currentPage === 'email' && <EmailNotifications />}
        {currentPage === 'attendance' && <Attendance employeeId={firstEmployeeId} />}
        {currentPage === 'onboarding' && <Onboarding employeeId={firstEmployeeId} />}
        {currentPage === 'recruitment' && <Recruitment />}
        {currentPage === 'learning' && <LearningManagement employeeId={firstEmployeeId} />}
        {currentPage === 'support' && <Support employeeId={firstEmployeeId} />}
        {currentPage === 'rewards' && <Rewards employeeId={firstEmployeeId} />}
        {currentPage === 'assets' && <AssetManagement />}
        {currentPage === 'holidays' && <HolidayManagement />}
      </div>

      {showAddForm && <AddEmployeeForm onClose={() => setShowAddForm(false)} onSuccess={handleAddSuccess} />}
      {showLeaveForm && <LeaveApply employeeId={firstEmployeeId} onClose={() => setShowLeaveForm(false)} onSuccess={handleLeaveSuccess} />}
      {selectedEmployee && <EmployeeDetail employeeId={selectedEmployee} onClose={() => setSelectedEmployee(null)} />}
    </div>
  );
}

export default Dashboard;