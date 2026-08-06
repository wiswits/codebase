import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ApplyLeave from '../components/leave/ApplyLeave';
import LeaveBalance from '../components/leave/LeaveBalance';
import LeaveHistory from '../components/leave/LeaveHistory';
import LeaveApproval from '../components/leave/LeaveApproval';
import LeaveCalendar from '../components/leave/LeaveCalendar';
import LeaveStats from '../components/leave/LeaveStats';
import LeavePolicy from '../components/leave/LeavePolicy';
import { useAuth } from '../contexts/AuthContext';

const LeavePage = () => {
  const { user } = useAuth();
  const isManagerOrAdmin = ['admin', 'hr', 'manager'].includes(user?.role);

  return (
    <Routes>
      <Route index element={
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ApplyLeave />
            <LeaveBalance />
          </div>
          <LeaveHistory />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeaveCalendar />
            <LeavePolicy />
          </div>
          {isManagerOrAdmin && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Management Controls
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LeaveApproval />
                <LeaveStats />
              </div>
            </div>
          )}
        </div>
      } />
      <Route path="apply" element={<ApplyLeave />} />
      <Route path="history" element={<LeaveHistory />} />
      <Route path="balance" element={<LeaveBalance />} />
      <Route path="calendar" element={<LeaveCalendar />} />
      <Route path="policy" element={<LeavePolicy />} />
      <Route path="approval" element={<LeaveApproval />} />
      <Route path="stats" element={<LeaveStats />} />
    </Routes>
  );
};

export default LeavePage;