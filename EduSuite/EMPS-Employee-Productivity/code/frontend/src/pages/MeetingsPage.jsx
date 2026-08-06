import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MeetingList from '../components/meetings/MeetingList';
import CreateMeeting from '../components/meetings/CreateMeeting';
import MeetingCalendar from '../components/meetings/MeetingCalendar';
import MeetingNotes from '../components/meetings/MeetingNotes';
import JoinMeeting from '../components/meetings/JoinMeeting';
import MeetingReminder from '../components/meetings/MeetingReminder';
import MeetingAttendance from '../components/meetings/MeetingAttendance';

const MeetingsPage = () => {
  return (
    <Routes>
      <Route index element={
        <div className="space-y-6">
          <MeetingReminder />
          <MeetingList />
          <MeetingCalendar />
        </div>
      } />
      <Route path="create" element={<CreateMeeting />} />
      <Route path="calendar" element={<MeetingCalendar />} />
      <Route path=":id" element={<MeetingList />} />
      <Route path=":id/join" element={<JoinMeeting />} />
      <Route path=":id/notes" element={<MeetingNotes />} />
      <Route path=":id/attendance" element={<MeetingAttendance />} />
    </Routes>
  );
};

export default MeetingsPage;