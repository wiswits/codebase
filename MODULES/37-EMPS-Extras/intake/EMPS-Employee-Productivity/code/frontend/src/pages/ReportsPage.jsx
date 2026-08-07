import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DailyReport from '../components/reports/DailyReport';
import WeeklyReport from '../components/reports/WeeklyReport';
import MonthlyReport from '../components/reports/MonthlyReport';
import TaskReport from '../components/reports/TaskReport';
import PerformanceReport from '../components/reports/PerformanceReport';
import AttendanceReport from '../components/reports/AttendanceReport';
import LeaveReport from '../components/reports/LeaveReport';
import ReportFilters from '../components/reports/ReportFilters';

const ReportsPage = () => {
  const { user } = useAuth();
  const role = user?.role;

  // Only admin, hr, manager can access management reports
  const canAccessManagementReports = ['admin', 'hr', 'manager'].includes(role);
  // Only admin and hr can access full reports
  const canAccessFullReports = ['admin', 'hr'].includes(role);

  return (
    <Routes>
      <Route index element={
        <div className="space-y-6">
          <ReportFilters />
          
          {/* Everyone can submit daily report */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DailyReport />
          </div>
          
          {/* Management reports - only for managers and above */}
          {canAccessManagementReports && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Management Reports
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <WeeklyReport />
                <MonthlyReport />
                <TaskReport />
                <PerformanceReport />
              </div>
            </div>
          )}
          
          {/* Full reports - only for admin and hr */}
          {canAccessFullReports && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Full Reports
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AttendanceReport />
                <LeaveReport />
              </div>
            </div>
          )}
        </div>
      } />
      
      <Route path="daily" element={<DailyReport />} />
      
      {/* Management reports - only for managers and above */}
      {canAccessManagementReports && (
        <>
          <Route path="weekly" element={<WeeklyReport />} />
          <Route path="monthly" element={<MonthlyReport />} />
          <Route path="tasks" element={<TaskReport />} />
          <Route path="performance" element={<PerformanceReport />} />
        </>
      )}
      
      {/* Full reports - only for admin and hr */}
      {canAccessFullReports && (
        <>
          <Route path="attendance" element={<AttendanceReport />} />
          <Route path="leave" element={<LeaveReport />} />
          <Route path="filters" element={<ReportFilters />} />
        </>
      )}
    </Routes>
  );
};

export default ReportsPage;