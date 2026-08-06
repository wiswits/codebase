import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TeamAttendance from '../components/manager/TeamAttendance';
import TeamTasks from '../components/manager/TeamTasks';
import TeamProductivity from '../components/manager/TeamProductivity';
import PerformanceReview from '../components/manager/PerformanceReview';
import DailyReportReview from '../components/manager/DailyReportReview';

const TeamPage = () => {
  return (
    <Routes>
      <Route index element={
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamAttendance />
            <TeamTasks />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamProductivity />
            <PerformanceReview />
          </div>
          <DailyReportReview />
        </div>
      } />
      <Route path="attendance" element={<TeamAttendance />} />
      <Route path="tasks" element={<TeamTasks />} />
      <Route path="productivity" element={<TeamProductivity />} />
      <Route path="performance" element={<PerformanceReview />} />
      <Route path="reports" element={<DailyReportReview />} />
    </Routes>
  );
};

export default TeamPage;