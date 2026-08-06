import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Dashboard } from './features/dashboard/pages/Dashboard';
import { HostelManagement } from './features/hierarchy/pages/HostelManagement';
import { BedGrid } from './features/hierarchy/pages/BedGrid';
import { Allocate } from './features/allocation/pages/Allocate';
import { Transfers } from './features/allocation/pages/Transfers';
import { Attendance } from './features/attendance/pages/Attendance';
import { LeaveManagement } from './features/leave/pages/LeaveManagement';
import { Complaints } from './features/complaints/pages/Complaints';
import { Reports } from './features/reports/pages/Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="hostels" element={<ProtectedRoute><HostelManagement /></ProtectedRoute>} />
          <Route path="hostels/:hostelId/beds" element={<ProtectedRoute><BedGrid /></ProtectedRoute>} />
          <Route path="allocate" element={<ProtectedRoute><Allocate /></ProtectedRoute>} />
          <Route path="transfers" element={<ProtectedRoute><Transfers /></ProtectedRoute>} />
          <Route path="attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="leave" element={<ProtectedRoute><LeaveManagement /></ProtectedRoute>} />
          <Route path="complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;