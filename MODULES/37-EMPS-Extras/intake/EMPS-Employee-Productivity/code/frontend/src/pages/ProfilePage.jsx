import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProfileView from '../components/profile/ProfileView';
import ProfileEdit from '../components/profile/ProfileEdit';
import PersonalInfo from '../components/profile/PersonalInfo';
import ContactInfo from '../components/profile/ContactInfo';
import EmploymentDetails from '../components/profile/EmploymentDetails';
import Skills from '../components/profile/Skills';
import Education from '../components/profile/Education';
import Experience from '../components/profile/Experience';
import EmergencyContact from '../components/profile/EmergencyContact';
import ProfileDocuments from '../components/profile/ProfileDocuments';
import BankDetails from '../components/profile/BankDetails';

const ProfilePage = () => {
  return (
    <Routes>
      <Route index element={<ProfileView />} />
      <Route path="edit" element={<ProfileEdit />} />
      <Route path="personal" element={<PersonalInfo />} />
      <Route path="contact" element={<ContactInfo />} />
      <Route path="employment" element={<EmploymentDetails />} />
      <Route path="skills" element={<Skills />} />
      <Route path="education" element={<Education />} />
      <Route path="experience" element={<Experience />} />
      <Route path="emergency" element={<EmergencyContact />} />
      <Route path="documents" element={<ProfileDocuments />} />
      <Route path="bank" element={<BankDetails />} />
    </Routes>
  );
};

export default ProfilePage;