import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import EventDetails from "./pages/EventDetails";
import Resources from "./pages/Resources";
import Bookings from "./pages/Bookings";
import Settings from "./pages/Settings";
import HelpSupport from "./pages/HelpSupport";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      {/* Everything here stays inside sidebar + topbar */}
      <Route element={<AppLayout />}>
        <Route
          index
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/events"
          element={<Events />}
        />

        <Route
          path="/events/create"
          element={<CreateEvent />}
        />

        <Route
          path="/events/:id"
          element={<EventDetails />}
        />

        <Route
          path="/events/:id/edit"
          element={<EditEvent />}
        />

        <Route
          path="/resources"
          element={<Resources />}
        />

        <Route
          path="/bookings"
          element={<Bookings />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        <Route
          path="/help"
          element={<HelpSupport />}
        />
      </Route>

      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}