import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './theme.css';
import Shell from './Shell.jsx';

// ─── Teacher ────────────────────────────────────────────────────
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import TeacherTests from './pages/TeacherTests.jsx';
import TestBuilder from './pages/TestBuilder.jsx';
import TestDetail from './pages/TestDetail.jsx';
import OfflineMarksEntry from './pages/OfflineMarksEntry.jsx';
import TestAnalyticsHero from './pages/TestAnalyticsHero.jsx';
import TestDistractors from './pages/TestDistractors.jsx';
import BlueprintManager from './pages/BlueprintManager.jsx';
import AssignmentTracker from './pages/AssignmentTracker.jsx';
import TeacherWeakAreas from './pages/TeacherWeakAreas.jsx';
import TeacherStudentDeepDive from './pages/TeacherStudentDeepDive.jsx';
import TeacherWorksheets from './pages/TeacherWorksheets.jsx';
import TeacherInsights from './pages/TeacherInsights.jsx';
import RootCauseDemo from './pages/RootCauseDemo.jsx';

// ─── Student ────────────────────────────────────────────────────
import StudentDashboard from './pages/StudentDashboard.jsx';
import StudentTests from './pages/StudentTests.jsx';
import StudentAttempt from './pages/StudentAttempt.jsx';
import StudentResult from './pages/StudentResult.jsx';
import StudentWeakAreas from './pages/StudentWeakAreas.jsx';
import StudentWorksheets from './pages/StudentWorksheets.jsx';
import StudentPractice from './pages/StudentPractice.jsx';
import ProgressReport from './pages/ProgressReport.jsx';

// ─── Parent ─────────────────────────────────────────────────────
import ParentOverview from './pages/ParentOverview.jsx';
import ParentProgress from './pages/ParentProgress.jsx';
import ParentReport from './pages/ParentReport.jsx';

// ─── Principal ──────────────────────────────────────────────────
import PrincipalRecoveryStats from './pages/PrincipalRecoveryStats.jsx';
import PrincipalSubjects from './pages/PrincipalSubjects.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Navigate to="/principal/pl" replace />} />

          {/* Teacher */}
          <Route path="/teacher/pl" element={<TeacherDashboard />} />
          <Route path="/teacher/pl/tests" element={<TeacherTests />} />
          <Route path="/teacher/pl/tests/create" element={<TestBuilder />} />
          <Route path="/teacher/pl/tests/:id" element={<TestDetail />} />
          <Route path="/teacher/pl/tests/:id/marks" element={<OfflineMarksEntry />} />
          <Route path="/teacher/pl/tests/:id/analytics" element={<TestAnalyticsHero />} />
          <Route path="/teacher/pl/tests/:id/distractors" element={<TestDistractors />} />
          <Route path="/teacher/pl/blueprints" element={<BlueprintManager />} />
          <Route path="/teacher/pl/assignments" element={<AssignmentTracker />} />
          <Route path="/teacher/pl/weak-areas" element={<TeacherWeakAreas />} />
          <Route path="/teacher/pl/students/:id" element={<TeacherStudentDeepDive />} />
          <Route path="/teacher/pl/worksheets" element={<TeacherWorksheets />} />
          <Route path="/teacher/pl/insights" element={<TeacherInsights />} />
          <Route path="/teacher/pl/root-cause" element={<RootCauseDemo />} />
          {/* legacy path kept working */}
          <Route path="/teacher/pl/marks" element={<OfflineMarksEntry />} />

          {/* Student */}
          <Route path="/student/pl" element={<StudentDashboard />} />
          <Route path="/student/pl/tests" element={<StudentTests />} />
          <Route path="/student/pl/attempt" element={<StudentAttempt />} />
          <Route path="/student/pl/attempt/:id" element={<StudentAttempt />} />
          <Route path="/student/pl/result/:id" element={<StudentResult />} />
          <Route path="/student/pl/weak-areas" element={<StudentWeakAreas />} />
          <Route path="/student/pl/worksheets" element={<StudentWorksheets />} />
          <Route path="/student/pl/practice" element={<StudentPractice />} />
          <Route path="/student/pl/progress" element={<ProgressReport />} />

          {/* Parent */}
          <Route path="/parent/pl" element={<ParentOverview />} />
          <Route path="/parent/pl/progress" element={<ParentProgress />} />
          <Route path="/parent/pl/report" element={<ParentReport />} />

          {/* Principal */}
          <Route path="/principal/pl" element={<PrincipalRecoveryStats />} />
          <Route path="/principal/pl/subjects" element={<PrincipalSubjects />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
