import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ChangePassword from '../components/settings/ChangePassword';
import ThemeSettings from '../components/settings/ThemeSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import SystemPreferences from '../components/settings/SystemPreferences';

const SettingsPage = () => {
  return (
    <Routes>
      <Route index element={
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChangePassword />
            <ThemeSettings />
          </div>
          <NotificationSettings />
          <SystemPreferences />
        </div>
      } />
      <Route path="password" element={<ChangePassword />} />
      <Route path="theme" element={<ThemeSettings />} />
      <Route path="notifications" element={<NotificationSettings />} />
      <Route path="preferences" element={<SystemPreferences />} />
    </Routes>
  );
};

export default SettingsPage;