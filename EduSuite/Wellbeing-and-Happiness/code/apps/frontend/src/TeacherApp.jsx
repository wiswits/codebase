import React, { useMemo, useState } from 'react';
import { makeApi, DEV_IDENTITIES } from './api.js';
import ClassMoodBoard from './screens/teacher/ClassMoodBoard.jsx';
import CircleTimeKits from './screens/teacher/CircleTimeKits.jsx';
import RaiseConcern from './screens/teacher/RaiseConcern.jsx';

const TABS = [
  { key: 'mood', label: 'Class Mood', icon: '📊' },
  { key: 'kits', label: 'Circle Time', icon: '📖' },
  { key: 'concern', label: 'Batao', icon: '💬' },
];

export default function TeacherApp() {
  const api = useMemo(() => makeApi(DEV_IDENTITIES.teacher), []);
  const [tab, setTab] = useState('mood');

  return (
    <>
      <main className="shell">
        {tab === 'mood' && <ClassMoodBoard api={api} onRaiseConcern={() => setTab('concern')} />}
        {tab === 'kits' && <CircleTimeKits onRaiseConcern={() => setTab('concern')} />}
        {tab === 'concern' && <RaiseConcern api={api} />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <span className="tab-icon">{t.icon}</span><span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
