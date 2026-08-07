// frontend/src/components/Attendance.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API_URL = 'http://localhost:5000';

function Attendance({ employeeId }) {
  const { showToast } = useToast();
  const [today, setToday] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    fetchData();
    getLocation();
  }, [employeeId, currentMonth, currentYear]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => {
          console.log('Location error:', err.message);
        }
      );
    }
  };

  const fetchData = async () => {
    try {
      const [todayRes, monthlyRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/attendance/today/${employeeId}`),
        fetch(`${API_URL}/api/v1/attendance/monthly/${employeeId}/${currentMonth}/${currentYear}`),
        fetch(`${API_URL}/api/v1/attendance/summary/${employeeId}/${currentMonth}/${currentYear}`)
      ]);
      const todayData = await todayRes.json();
      const monthlyData = await monthlyRes.json();
      const summaryData = await summaryRes.json();
      setToday(todayData.data);
      setMonthly(monthlyData.data || []);
      setSummary(summaryData.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/attendance/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          latitude: location.lat,
          longitude: location.lng,
          source: 'WEB'
        })
      });
      const data = await response.json();
      if (response.ok) {
        showToast('✅ Checked in successfully!', 'success');
        fetchData();
      } else {
        showToast('❌ ' + (data.error?.message || 'Failed to check in'), 'error');
      }
    } catch (error) {
      showToast('❌ Network error', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCheckOut = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/attendance/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          latitude: location.lat,
          longitude: location.lng,
          source: 'WEB'
        })
      });
      const data = await response.json();
      if (response.ok) {
        showToast('✅ Checked out successfully!', 'success');
        fetchData();
      } else {
        showToast('❌ ' + (data.error?.message || 'Failed to check out'), 'error');
      }
    } catch (error) {
      showToast('❌ Network error', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      PRESENT: 'bg-green-100 text-green-700',
      ABSENT: 'bg-red-100 text-red-700',
      HALF_DAY: 'bg-yellow-100 text-yellow-700',
      ON_LEAVE: 'bg-purple-100 text-purple-700',
      HOLIDAY: 'bg-blue-100 text-blue-700',
      WEEKLY_OFF: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-4">Loading attendance...</div>;

  return (
    <div className="p-4">
      <h3 className="font-bold text-gray-800 dark:text-white mb-4">📍 Attendance</h3>

      {/* Today's Status */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Today</h4>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className={`text-lg font-bold ${today ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {today ? '✅ Present' : '❌ Absent'}
            </p>
          </div>
          {today && (
            <>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Check In</p>
                <p className="font-medium text-gray-800 dark:text-white">{today.check_in_time}</p>
              </div>
              {today.check_out_time && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check Out</p>
                  <p className="font-medium text-gray-800 dark:text-white">{today.check_out_time}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Worked Hours</p>
                <p className="font-medium text-gray-800 dark:text-white">{today.worked_hours || 0}h</p>
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleCheckIn}
            disabled={isChecking || today?.check_in_time}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isChecking ? 'Checking...' : '✅ Check In'}
          </button>
          <button
            onClick={handleCheckOut}
            disabled={isChecking || !today?.check_in_time || today?.check_out_time}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isChecking ? 'Checking...' : '❌ Check Out'}
          </button>
        </div>
        {location.lat && (
          <p className="text-xs text-gray-400 mt-2">
            📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        )}
      </div>

      {/* Monthly Summary */}
      {summary && (
        <div className="mb-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{summary.present || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Present</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{summary.absent || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Absent</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{summary.half_day || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Half Day</p>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{summary.on_leave || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Leave</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{summary.holiday || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Holiday</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xl font-bold text-gray-600 dark:text-gray-400">{summary.weekly_off || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Week Off</p>
          </div>
        </div>
      )}

      {/* Monthly Calendar View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <button
            onClick={() => {
              if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1); }
              else { setCurrentMonth(currentMonth - 1); }
            }}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
          >
            ◀
          </button>
          <span className="font-medium text-gray-800 dark:text-white">
            {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} {currentYear}
          </span>
          <button
            onClick={() => {
              if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1); }
              else { setCurrentMonth(currentMonth + 1); }
            }}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
          >
            ▶
          </button>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthly.map((day, index) => (
              <div
                key={index}
                className={`text-center p-2 rounded-lg text-xs ${day.status ? getStatusBadge(day.status) : 'text-gray-400'}`}
              >
                {day.attendance_date ? new Date(day.attendance_date).getDate() : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attendance;