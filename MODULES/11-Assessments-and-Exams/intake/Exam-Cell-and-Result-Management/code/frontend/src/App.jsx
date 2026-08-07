import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/auth/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ExamScheduler from './pages/ExamScheduler.jsx';
import QuestionBank from './pages/QuestionBank.jsx';
import BlueprintBuilder from './pages/BlueprintBuilder.jsx';
import PaperGeneration from './pages/PaperGeneration.jsx';
import SeatingPlan from './pages/SeatingPlan.jsx';
import Invigilation from './pages/Invigilation.jsx';
import HallTickets from './pages/HallTickets.jsx';
import OMREvaluation from './pages/OMREvaluation.jsx';
import ResultEntry from './pages/ResultEntry.jsx';
import Moderation from './pages/Moderation.jsx';
import ResultProcessing from './pages/ResultProcessing.jsx';
import ResultPublishing from './pages/ResultPublishing.jsx';
import ReportsAnalytics from './pages/ReportsAnalytics.jsx';
import StudentResultPortal from './pages/StudentResultPortal.jsx';
import StudentSeatingView from './pages/StudentSeatingView.jsx';
import StudentPractice from './pages/StudentPractice.jsx';
import Settings from './pages/Settings.jsx';
import VerifyHallTicket from './pages/VerifyHallTicket.jsx';
import ComingSoon from './pages/ComingSoon.jsx';

// Students land on their result portal; every other role lands on the admin Dashboard.
function HomeRoute() {
  const { user } = useAuth();
  return user?.role === 'student' ? <StudentResultPortal /> : <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/verify/:ticketNo" element={<VerifyHallTicket />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/my-results" element={<StudentResultPortal />} />
          <Route path="/my-seating-plan" element={<StudentSeatingView />} />
          <Route path="/practice-questions" element={<StudentPractice />} />
          <Route path="/exam-scheduler" element={<ExamScheduler />} />
          <Route path="/question-bank" element={<QuestionBank />} />
          <Route path="/blueprint-builder" element={<BlueprintBuilder />} />
          <Route path="/paper-generation" element={<PaperGeneration />} />
          <Route path="/seating-plan" element={<SeatingPlan />} />
          <Route path="/invigilation" element={<Invigilation />} />
          <Route path="/hall-tickets" element={<HallTickets />} />
          <Route path="/omr-evaluation" element={<OMREvaluation />} />
          <Route path="/result-entry" element={<ResultEntry />} />
          <Route path="/moderation" element={<Moderation />} />
          <Route path="/result-processing" element={<ResultProcessing />} />
          <Route path="/result-publishing" element={<ResultPublishing />} />
          <Route path="/reports-analytics" element={<ReportsAnalytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<ComingSoon title="Page Not Found" />} />
    </Routes>
  );
}
