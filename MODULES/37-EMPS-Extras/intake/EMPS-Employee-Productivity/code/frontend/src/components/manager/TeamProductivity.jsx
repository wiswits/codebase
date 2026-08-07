import React, { useState, useEffect } from 'react';
import { FaChartLine, FaTrophy, FaUser, FaCheckCircle, FaClock } from 'react-icons/fa';
import { analyticsApi } from '../../api/analyticsApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TeamProductivity = () => {
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await analyticsApi.getTeam();
      setTeamData(response.data?.teamPerformance || []);
    } catch (err) {
      setError('Failed to load team productivity data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return <div className="text-center py-8 text-red-600 dark:text-red-400">{error}</div>;
  }

  const chartData = teamData.map(member => ({
    name: `${member.employee?.firstName} ${member.employee?.lastName}`,
    productivity: Math.round(member.productivity || 0),
    tasks: member.tasks?.completed || 0
  }));

  const avgProductivity = teamData.length > 0 ? Math.round(teamData.reduce((sum, m) => sum + (m.productivity || 0), 0) / teamData.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FaChartLine className="text-indigo-600 dark:text-indigo-400 text-xl" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Productivity</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <FaTrophy className="mx-auto text-yellow-500 text-3xl mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Average Productivity</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgProductivity}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <FaUser className="mx-auto text-blue-500 text-3xl mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Team Size</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{teamData.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <FaCheckCircle className="mx-auto text-green-500 text-3xl mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Tasks Completed</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{teamData.reduce((sum, m) => sum + (m.tasks?.completed || 0), 0)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Performance</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Bar dataKey="productivity" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Members</h3>
        <div className="space-y-3">
          {teamData.map((member, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
                  {member.employee?.firstName?.[0]}{member.employee?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{member.employee?.firstName} {member.employee?.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.employee?.position || 'Employee'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{Math.round(member.productivity || 0)}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.tasks?.completed || 0} tasks</p>
                </div>
                <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(member.productivity || 0, 100)}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamProductivity;