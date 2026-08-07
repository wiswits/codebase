import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const linkStyle = ({ isActive }) => ({
  padding: '7px 12px',
  borderRadius: 'var(--radius-sm)',
  color: isActive ? 'var(--text)' : 'var(--text-dim)',
  background: isActive ? 'var(--brand-soft)' : 'transparent',
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: 'nowrap',
});

const roleTabStyle = (active) => ({
  padding: '6px 16px',
  borderRadius: 999,
  border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
  background: active ? 'var(--brand)' : 'transparent',
  color: active ? '#fff' : 'var(--text-dim)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
});

const ROLES = {
  teacher: {
    label: 'Teacher',
    links: [
      ['/teacher/pl', 'Dashboard'],
      ['/teacher/pl/tests', 'Tests'],
      ['/teacher/pl/tests/create', '+ New Test'],
      ['/teacher/pl/blueprints', 'Blueprints'],
      ['/teacher/pl/assignments', 'Assignments'],
      ['/teacher/pl/weak-areas', 'Weak Areas'],
      ['/teacher/pl/worksheets', 'Worksheets'],
      ['/teacher/pl/insights', 'Insights'],
      ['/teacher/pl/root-cause', 'Root Cause Demo'],
    ],
  },
  student: {
    label: 'Student',
    links: [
      ['/student/pl', 'Dashboard'],
      ['/student/pl/tests', 'My Tests'],
      ['/student/pl/attempt', 'Take a Test'],
      ['/student/pl/weak-areas', 'My Gaps'],
      ['/student/pl/worksheets', 'My Worksheets'],
      ['/student/pl/practice', 'Practice'],
      ['/student/pl/progress', 'Progress Report'],
    ],
  },
  parent: {
    label: 'Parent',
    links: [
      ['/parent/pl', 'Overview'],
      ['/parent/pl/progress', 'Progress'],
      ['/parent/pl/report', 'Full Report'],
    ],
  },
  principal: {
    label: 'Principal',
    links: [
      ['/principal/pl', 'Recovery Stats'],
      ['/principal/pl/subjects', 'Subject Health'],
    ],
  },
};

function roleForPath(path) {
  for (const key of Object.keys(ROLES)) {
    if (path.startsWith(`/${key}/`)) return key;
  }
  return 'teacher';
}

export default function Shell() {
  const location = useLocation();
  const [role, setRole] = useState(() => roleForPath(location.pathname));

  useEffect(() => {
    setRole(roleForPath(location.pathname));
  }, [location.pathname]);

  const active = ROLES[role];

  return (
    <div>
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 24px', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>
            🎯 WISWITS APEX <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>· Personalized Learning</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.entries(ROLES).map(([key, r]) => (
              <button key={key} onClick={() => setRole(key)} style={roleTabStyle(role === key)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 4, padding: '0 24px 10px', overflowX: 'auto' }}>
          {active.links.map(([to, label]) => (
            <NavLink key={to} to={to} style={linkStyle} end={to.split('/').length <= 3}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 80px' }}>
        <Outlet />
      </main>
    </div>
  );
}
