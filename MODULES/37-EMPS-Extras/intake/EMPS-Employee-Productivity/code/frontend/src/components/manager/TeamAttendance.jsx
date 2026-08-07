import React, { useState, useEffect } from 'react';
import { FaUserCheck, FaUserTimes, FaClock, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { attendanceApi } from '../../api/attendanceApi';
import { analyticsApi } from '../../api/analyticsApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { format } from 'date-fns';

const TeamAttendance = () => {
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeamAttendance();
  }, [date]);

  const fetchTeamAttendance = async () => {
    setLoading(true);
    try {
      const response = await analyticsApi.getTeam();
      setTeamData(response.data?.teamPerformance || []);
    } catch (err) {
      setError('Failed to load team attendance');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeam = teamData.filter(member =>
    `${member.employee?.firstName} ${member.employee?.lastName} ${member.employee?.employeeId}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FaUserCheck className="text-indigo-600 dark:text-indigo-400 text-xl" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Attendance</h2>
        </div>
        <div className="flex items-center space-x-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
      </div>

      <div className="relative">
        <input type="text" placeholder="Search team members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Team Member</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Check In</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Check Out</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Hours</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.map((member, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-sm">
                        {member.employee?.firstName?.[0]}{member.employee?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{member.employee?.firstName} {member.employee?.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.employee?.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{member.attendance?.checkIn || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{member.attendance?.checkOut || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{member.attendance?.hours || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${member.attendance?.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : member.attendance?.status === 'late' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {member.attendance?.status?.toUpperCase() || 'ABSENT'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTeam.length === 0 && <div className="text-center py-8 text-gray-500 dark:text-gray-400"><p>No team members found</p></div>}
      </div>
    </div>
  );
};

export default TeamAttendance;