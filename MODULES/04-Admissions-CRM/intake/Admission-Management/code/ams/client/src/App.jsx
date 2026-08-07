import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Enquiries from './pages/Enquiries';
import Applications from './pages/Applications';
import Documents from './pages/Documents';
import EntranceTest from './pages/EntranceTest';
import Interviews from './pages/Interviews';
import Offers from './pages/Offers';
import Admissions from './pages/Admissions';
import Quotas from './pages/Quotas';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import PublicApplicationForm from './pages/PublicApplicationForm';
import OfferAccept from './pages/OfferAccept';

function App() {
  return (
    <Routes>
      {/* Public, no-login routes (FR1-FR3, FR23/FR24) */}
      <Route path="/apply" element={<PublicApplicationForm />} />
      <Route path="/apply/:draftToken" element={<PublicApplicationForm />} />
      <Route path="/offer/:token" element={<OfferAccept />} />

      <Route path="/login" element={<Login />} />

      {/* Authenticated staff area, role-gated per screen */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="applications" element={<Applications />} />
        <Route path="documents" element={<Documents />} />
        <Route path="entrance-test" element={<EntranceTest />} />
        <Route path="interviews" element={<Interviews />} />
        <Route path="offers" element={<Offers />} />
        <Route path="admissions" element={<Admissions />} />
        <Route path="quotas" element={<Quotas />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
