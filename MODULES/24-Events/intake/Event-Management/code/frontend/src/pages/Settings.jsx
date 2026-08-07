import {
  Bell,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";

import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { theme, toggleTheme } =
    useTheme();

  return (
    <div className="page-container settings-page page-enter">
      <section className="page-heading settings-heading">
        <div>
          <span className="page-kicker">
            SYSTEM
          </span>

          <h1>Settings</h1>

          <p>
            Manage your Event Management
            workspace preferences.
          </p>
        </div>
      </section>

      <section className="settings-grid">
        <article className="settings-card">
          <div className="settings-card-icon">
            {theme === "dark" ? (
              <Moon size={22} />
            ) : (
              <Sun size={22} />
            )}
          </div>

          <div className="settings-card-content">
            <h2>Appearance</h2>

            <p>
              Choose how the WisWits workspace
              appears on this device.
            </p>

            <button
              type="button"
              className="secondary-button settings-action"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <>
                  <Sun size={17} />
                  Switch to Light Mode
                </>
              ) : (
                <>
                  <Moon size={17} />
                  Switch to Dark Mode
                </>
              )}
            </button>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-icon">
            <UserRound size={22} />
          </div>

          <div className="settings-card-content">
            <h2>
              Administrator Profile
            </h2>

            <p>
              Current workspace access is
              configured for the Event
              Administrator.
            </p>

            <div className="settings-profile">
              <div className="settings-avatar">
                AD
              </div>

              <div>
                <strong>
                  Admin User
                </strong>
                <span>
                  Event Administrator
                </span>
              </div>
            </div>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-icon">
            <Bell size={22} />
          </div>

          <div className="settings-card-content">
            <h2>Notifications</h2>

            <p>
              Event and resource activity
              notifications are enabled for
              this workspace.
            </p>

            <span className="settings-status">
              <span />
              Enabled
            </span>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-icon">
            <ShieldCheck size={22} />
          </div>

          <div className="settings-card-content">
            <h2>
              System Connection
            </h2>

            <p>
              The frontend is configured to
              communicate with the WisWits
              Event Management API.
            </p>

            <span className="settings-status">
              <span />
              Backend connected
            </span>
          </div>
        </article>
      </section>
    </div>
  );
}