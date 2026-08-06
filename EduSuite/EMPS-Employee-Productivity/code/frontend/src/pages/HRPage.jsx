import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EmployeeVerification from '../components/hr/EmployeeVerification';
import OfferLetterGeneration from '../components/hr/OfferLetterGeneration';
import SalarySlipGeneration from '../components/hr/SalarySlipGeneration';
import RecruitmentManagement from '../components/hr/RecruitmentManagement';
import TrainingManagement from '../components/hr/TrainingManagement';
import HolidayCalendar from '../components/hr/HolidayCalendar';

const HRPage = () => {
  return (
    <Routes>
      <Route index element={
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmployeeVerification />
            <RecruitmentManagement />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrainingManagement />
            <HolidayCalendar />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OfferLetterGeneration />
            <SalarySlipGeneration />
          </div>
        </div>
      } />
      <Route path="verification" element={<EmployeeVerification />} />
      <Route path="offer-letter" element={<OfferLetterGeneration />} />
      <Route path="salary-slip" element={<SalarySlipGeneration />} />
      <Route path="recruitment" element={<RecruitmentManagement />} />
      <Route path="training" element={<TrainingManagement />} />
      <Route path="holidays" element={<HolidayCalendar />} />
    </Routes>
  );
};

export default HRPage;