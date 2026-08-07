import React, { useState } from 'react';
import HelplineBar from './HelplineBar.jsx';
import CrisisScreen from './CrisisScreen.jsx';
import PulseCheckIn from './screens/PulseCheckIn.jsx';
import Journal from './screens/Journal.jsx';
import TalkToSomeone from './screens/TalkToSomeone.jsx';
import Activities from './screens/Activities.jsx';
import ConsentScreen from './screens/ConsentScreen.jsx';
import TeacherApp from './TeacherApp.jsx';
import CounsellorApp from './CounsellorApp.jsx';
import PrincipalApp from './PrincipalApp.jsx';
import AnonymousReport from './screens/AnonymousReport.jsx';

// ⚠️ DEV ONLY role switcher. In production each user lands in exactly one
//    experience from their platform session; there is no client-side role pick.
const ROLES = [['student', '🧒 Student'], ['teacher', '👨‍🏫 Teacher'],
  ['counsellor', '👩‍⚕️ Counsellor'], ['principal', '🏫 Principal'], ['report', '🕊 Report']];

// The student experience (PRD Part 5 + Part 7 Weeks 7). The helpline bar is
// ALWAYS present; a returned crisis payload renders the un-dismissable crisis
// screen over everything. Consent gates entry — "Abhi nahi" is fully honoured.

const TABS = [
  { key: 'pulse', label: 'Aaj', icon: '🌤' },
  { key: 'journal', label: 'Diary', icon: '📔' },
  { key: 'talk', label: 'Baat', icon: '💬' },
  { key: 'activities', label: 'Cheezein', icon: '🌱' },
];

export default function App() {
  const [role, setRole] = useState('student');
  const [consented, setConsented] = useState(null); // null = undecided
  const [tab, setTab] = useState('pulse');
  const [crisis, setCrisis] = useState(null);

  const devSwitcher = (
    <div className="role-switch">
      {ROLES.map(([r, label]) => (
        <button key={r} className={`role-btn ${role === r ? 'on' : ''}`} onClick={() => setRole(r)}>{label}</button>
      ))}
    </div>
  );

  if (role === 'teacher') {
    return <div className="app"><HelplineBar />{devSwitcher}<TeacherApp /></div>;
  }
  if (role === 'counsellor') {
    return <div className="app"><HelplineBar />{devSwitcher}<CounsellorApp /></div>;
  }
  if (role === 'principal') {
    return <div className="app"><HelplineBar />{devSwitcher}<PrincipalApp /></div>;
  }
  if (role === 'report') {
    return <div className="app"><HelplineBar />{devSwitcher}<main className="shell"><AnonymousReport /></main></div>;
  }

  return (
    <div className="app">
      <HelplineBar />
      {devSwitcher}

      {crisis && (
        <CrisisScreen
          level={crisis.level}
          message={crisis.message}
          helplines={crisis.helplines}
          onImOkay={() => setCrisis(null)}
          onBreathe={() => { setCrisis(null); setTab('activities'); }}
        />
      )}

      {consented === null && <ConsentScreen onDecided={setConsented} />}

      {consented === false && (
        <main className="shell center">
          <h2>Koi baat nahi 💚</h2>
          <p className="muted">Jab bhi mann ho, yahan aa sakte ho. Kuch nahi badla.</p>
          <button className="primary-btn" onClick={() => setConsented(null)}>Ek baar phir dekhun</button>
        </main>
      )}

      {consented === true && (
        <>
          <main className="shell">
            {tab === 'pulse' && (
              <PulseCheckIn
                onCrisis={setCrisis}
                onOpenJournal={() => setTab('journal')}
                onOpenTalk={() => setTab('talk')}
                onOpenActivity={() => setTab('activities')}
              />
            )}
            {tab === 'journal' && <Journal />}
            {tab === 'talk' && <TalkToSomeone />}
            {tab === 'activities' && <Activities />}
          </main>

          <nav className="tabbar">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`tab ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                <span className="tab-icon">{t.icon}</span>
                <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
