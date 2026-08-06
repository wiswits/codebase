// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login/Login';
import Register from './components/auth/Register/Register';
import Dashboard from './components/dashboard/Dashboard/Dashboard';
import Profile from './components/profile/Profile/Profile';
import Directory from './components/directory/Directory/Directory';
import AlumniDetail from './components/directory/AlumniDetail/AlumniDetail';
import Mentorship from './components/mentorship/Mentorship/Mentorship';
import Events from './components/events/Events/Events';
import Stories from './components/stories/Stories/Stories';
import Donations from './components/donations/Donations/Donations';
import Reunions from './components/reunions/Reunions/Reunions';
import Reports from './components/reports/Reports';
import ImportData from './components/admin/ImportData/ImportData';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/directory" element={<PrivateRoute><Directory /></PrivateRoute>} />
      <Route path="/alumni/:id" element={<PrivateRoute><AlumniDetail /></PrivateRoute>} />
      <Route path="/mentorship" element={<PrivateRoute><Mentorship /></PrivateRoute>} />
      <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
      <Route path="/stories" element={<PrivateRoute><Stories /></PrivateRoute>} />
      <Route path="/donations" element={<PrivateRoute><Donations /></PrivateRoute>} />
      <Route path="/reunions" element={<PrivateRoute><Reunions /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/import" element={<PrivateRoute><ImportData /></PrivateRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;