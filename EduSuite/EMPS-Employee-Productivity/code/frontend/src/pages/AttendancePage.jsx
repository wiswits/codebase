import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CheckIn from '../components/attendance/CheckIn';
import CheckOut from '../components/attendance/CheckOut';
import LunchBreak from '../components/attendance/LunchBreak';
import WorkTimer from '../components/attendance/WorkTimer';
import AttendanceHistory from '../components/attendance/AttendanceHistory';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';
import AttendanceStatistics from '../components/attendance/AttendanceStatistics';
import ManualAttendanceCorrection from '../components/attendance/ManualAttendanceCorrection';

const AttendancePage = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState(null);
  const isManagerOrAdmin = ['admin', 'hr', 'manager'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CheckIn onCheckIn={setAttendanceData} />
        <CheckOut onCheckOut={setAttendanceData} />
        <LunchBreak onLunchStart={() => {}} onLunchEnd={() => {}} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkTimer 
          checkIn={attendanceData?.checkIn?.time}
          checkOut={attendanceData?.checkOut?.time}
          lunchBreak={attendanceData?.lunchBreak}
        />
        <AttendanceStatistics />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceHistory />
        <AttendanceCalendar />
      </div>

      {isManagerOrAdmin && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Admin Controls
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ManualAttendanceCorrection 
              record={attendanceData} 
              onCorrectionComplete={() => setAttendanceData(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;