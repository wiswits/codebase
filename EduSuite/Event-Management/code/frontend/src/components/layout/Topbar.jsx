import {
  Bell,
  CalendarDays,
  ChevronDown,
  Command,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Boxes,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useTheme } from "../../context/ThemeContext";

const searchableItems = [
  {
    title: "Events",
    subtitle: "View and manage events",
    path: "/events",
    icon: CalendarDays,
    keywords: "events event calendar activity",
  },
  {
    title: "Create Event",
    subtitle: "Create a new institutional event",
    path: "/events/create",
    icon: CalendarDays,
    keywords: "create add event schedule",
  },
  {
    title: "Resources",
    subtitle: "Manage event resources",
    path: "/resources",
    icon: Boxes,
    keywords: "resources rooms equipment resource",
  },
  {
    title: "Bookings",
    subtitle: "View resource bookings",
    path: "/bookings",
    icon: CalendarDays,
    keywords: "bookings reservations booking",
  },
  {
    title: "Settings",
    subtitle: "Application preferences",
    path: "/settings",
    icon: Settings,
    keywords: "settings preferences configuration",
  },
];

export default function Topbar() {
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();

  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const filteredItems = query.trim()
    ? searchableItems.filter((item) => {
        const searchable =
          `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase();

        return searchable.includes(
          query.toLowerCase().trim()
        );
      })
    : searchableItems.slice(0, 4);

  function selectSearchItem(item) {
    navigate(item.path);
    setQuery("");
    setSearchOpen(false);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    if (filteredItems.length > 0) {
      selectSearchItem(filteredItems[0]);
    }
  }

  useEffect(() => {
    setSearchOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleKeyboard(event) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        searchRef.current?.focus();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);

        searchRef.current?.blur();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setNotificationsOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
  }, []);

  return (
    <header className="topbar">
      {/* SEARCH */}
      <div className="topbar-search-wrapper">
        <form
          className={`topbar-search ${
            searchOpen ? "focused" : ""
          }`}
          onSubmit={handleSearchSubmit}
        >
          <Search
            size={19}
            className="topbar-search-icon"
          />

          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder="Search events, resources..."
            aria-label="Search"
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() =>
              setSearchOpen(true)
            }
          />

          <span className="search-shortcut">
            <Command size={12} />
            K
          </span>
        </form>

        {searchOpen && (
          <div className="search-dropdown">
            <div className="search-dropdown-header">
              <span>
                {query
                  ? "Search results"
                  : "Quick navigation"}
              </span>
            </div>

            {filteredItems.length > 0 ? (
              <div className="search-results">
                {filteredItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      type="button"
                      className="search-result"
                      onMouseDown={(event) =>
                        event.preventDefault()
                      }
                      onClick={() =>
                        selectSearchItem(item)
                      }
                    >
                      <span className="search-result-icon">
                        <Icon size={17} />
                      </span>

                      <span className="search-result-copy">
                        <strong>
                          {item.title}
                        </strong>

                        <small>
                          {item.subtitle}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="search-empty">
                <Search size={20} />

                <span>
                  No matching pages found
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT ACTIONS */}
      <div className="topbar-actions">
        {/* THEME */}
        <button
          type="button"
          className="topbar-icon-button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          {theme === "dark" ? (
            <Sun size={19} />
          ) : (
            <Moon size={19} />
          )}
        </button>

        {/* NOTIFICATIONS */}
        <div
          className="topbar-dropdown-wrapper"
          ref={notificationRef}
        >
          <button
            type="button"
            className={`topbar-icon-button notification-button ${
              notificationsOpen
                ? "active"
                : ""
            }`}
            aria-label="Notifications"
            aria-expanded={
              notificationsOpen
            }
            onClick={() => {
              setNotificationsOpen(
                (current) => !current
              );

              setProfileOpen(false);
            }}
          >
            <Bell size={19} />

            <span className="notification-dot" />
          </button>

          {notificationsOpen && (
            <div className="topbar-dropdown notification-dropdown">
              <div className="dropdown-heading">
                <div>
                  <strong>Notifications</strong>
                  <span>
                    Event Management updates
                  </span>
                </div>

                <span className="notification-count">
                  2
                </span>
              </div>

              <div className="notification-list">
                <div className="notification-item unread">
                  <span className="notification-item-icon">
                    <CalendarDays
                      size={17}
                    />
                  </span>

                  <div>
                    <strong>
                      Events synchronized
                    </strong>

                    <p>
                      Your event workspace is
                      connected to the backend.
                    </p>

                    <small>
                      Just now
                    </small>
                  </div>
                </div>

                <div className="notification-item">
                  <span className="notification-item-icon">
                    <Boxes size={17} />
                  </span>

                  <div>
                    <strong>
                      Resources available
                    </strong>

                    <p>
                      Resource management is
                      ready for bookings.
                    </p>

                    <small>
                      System
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="topbar-divider" />

        {/* USER */}
        <div
          className="topbar-dropdown-wrapper"
          ref={profileRef}
        >
          <button
            type="button"
            className={`user-menu ${
              profileOpen ? "active" : ""
            }`}
            onClick={() => {
              setProfileOpen(
                (current) => !current
              );

              setNotificationsOpen(false);
            }}
          >
            <div className="user-avatar">
              AD
            </div>

            <div className="user-info">
              <strong>Admin User</strong>
              <span>
                Event Administrator
              </span>
            </div>

            <ChevronDown
              size={16}
              className={
                profileOpen
                  ? "chevron-open"
                  : ""
              }
            />
          </button>

          {profileOpen && (
            <div className="topbar-dropdown profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-large-avatar">
                  AD
                </div>

                <div>
                  <strong>Admin User</strong>
                  <span>
                    Event Administrator
                  </span>
                </div>
              </div>

              <div className="profile-menu-items">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/settings");
                    setProfileOpen(false);
                  }}
                >
                  <Settings size={17} />
                  Settings
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/help");
                    setProfileOpen(false);
                  }}
                >
                  <User size={17} />
                  Help & Support
                </button>
              </div>

              <div className="profile-menu-footer">
                <button
                  type="button"
                  className="logout-button"
                  onClick={() => {
                    localStorage.removeItem(
                      "token"
                    );

                    window.location.reload();
                  }}
                >
                  <LogOut size={17} />
                  Clear session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}