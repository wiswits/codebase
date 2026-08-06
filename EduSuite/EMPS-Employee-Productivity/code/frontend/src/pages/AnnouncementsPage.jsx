import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AnnouncementList from '../components/announcements/AnnouncementList';
import CreateAnnouncement from '../components/announcements/CreateAnnouncement';
import HolidayList from '../components/announcements/HolidayList';
import EmergencyAlerts from '../components/announcements/EmergencyAlerts';

const AnnouncementsPage = () => {
  return (
    <Routes>
      <Route index element={
        <div className="space-y-6">
          <EmergencyAlerts />
          <AnnouncementList />
          <HolidayList />
        </div>
      } />
      <Route path="create" element={<CreateAnnouncement />} />
      <Route path="holidays" element={<HolidayList />} />
      <Route path="emergency" element={<EmergencyAlerts />} />
    </Routes>
  );
};

export default AnnouncementsPage;