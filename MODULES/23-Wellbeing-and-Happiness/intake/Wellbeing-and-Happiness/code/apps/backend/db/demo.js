// db/demo.js — one-shot demo setup against the local MariaDB/MySQL.
//
// 1. creates the platform `client_students` table (stub) + seeds a roster
// 2. runs the wb migrations (schema, restricted user, grants, triggers)
// 3. seeds the activities library
// 4. seeds realistic well-being data through the REAL code paths so every
//    dashboard has something to show (consent, pulses with patterns, a
//    self-raise red flag, a teacher concern, cases + an encrypted note, an
//    anonymous report, staff checks)
//
// Usage:  node db/demo.js        (idempotent-ish: drops & recreates wb data)

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB = process.env.DB_NAME || 'wiswits';

function sub(sql) {
  return sql
    .replaceAll('__WB_USER__', process.env.WB_DB_USER || 'wiswits_wb')
    .replaceAll('__WB_PASSWORD__', process.env.WB_DB_PASSWORD || 'change-me');
}

async function admin() {
  return mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_ADMIN_USER, password: process.env.DB_ADMIN_PASSWORD,
    multipleStatements: true,
  });
}

// ─── roster: 34 students across classes; ids chosen so the frontend demo
//     identities line up (student #7 participates, #42 is the red-flag case). ──
function roster() {
  const rows = [];
  const classes = [['6', 'A', 6], ['9', 'B', 8], ['10', 'A', 10], ['11', 'A', 6], ['12', 'C', 4]];
  let id = 1;
  for (const [cls, sec, n] of classes) {
    for (let i = 0; i < n; i++) {
      const age = Number(cls) + 5; // rough
      const dob = `${2026 - age}-06-15`;
      rows.push([id++, 1, cls, sec, id % 2 ? 'M' : 'F', dob, '2020-04-01']);
    }
  }
  // Ensure the two demo ids exist with known classes.
  if (!rows.find((r) => r[0] === 7)) rows.push([7, 1, '9', 'B', 'M', '2012-06-15', '2020-04-01']);
  if (!rows.find((r) => r[0] === 42)) rows.push([42, 1, '10', 'A', 'M', '2011-06-15', '2020-04-01']);
  return rows;
}

async function main() {
  const a = await admin();
  console.log('→ creating database + client_students stub');
  await a.query(`CREATE DATABASE IF NOT EXISTS \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await a.changeUser({ database: DB });

  await a.query(`CREATE TABLE IF NOT EXISTS client_students (
    id BIGINT UNSIGNED PRIMARY KEY, org_id BIGINT UNSIGNED NOT NULL,
    class_no VARCHAR(16), section VARCHAR(16), gender CHAR(1), dob DATE,
    admission_date DATE, name VARCHAR(120) NULL, deleted_at DATETIME NULL)`);
  await a.query('DELETE FROM client_students');
  const students = roster();
  await a.query(
    'INSERT INTO client_students (id, org_id, class_no, section, gender, dob, admission_date) VALUES ?',
    [students]
  );
  console.log(`  seeded ${students.length} students`);

  // ─── run migrations in order ───
  const dir = path.join(__dirname, 'migrations');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    process.stdout.write(`→ migrate ${f} ... `);
    await a.query(sub(fs.readFileSync(path.join(dir, f), 'utf8')));
    console.log('ok');
  }
  await a.end();

  // ─── from here, use the app's wb pool (restricted user) + services ───
  process.env.WB_SKIP_DB_BOOT_CHECK = '1';
  const { wbDb, closePools } = require('../src/config/db');
  const repo = require('../src/modules/wellbeing/wellbeing.repo');
  const { seedGlobalActivities } = require('../src/modules/wellbeing/wellbeing.activities');
  const { raiseSelf, evaluateAndFlag } = require('../src/modules/wellbeing/wellbeing.flags');
  const { raiseConcern } = require('../src/modules/wellbeing/wellbeing.concern');
  const cases = require('../src/modules/wellbeing/wellbeing.cases');
  const journal = require('../src/modules/wellbeing/wellbeing.journal');
  const reports = require('../src/modules/wellbeing/wellbeing.reports');
  const staff = require('../src/modules/wellbeing/wellbeing.staff');

  console.log('→ seeding activities');
  await seedGlobalActivities();

  // clean wb data (idempotent re-runs)
  for (const t of ['wb_pulse', 'wb_flag', 'wb_case', 'wb_signal', 'wb_consent',
    'wb_journal', 'wb_session_note', 'wb_bullying_report', 'wb_staff_check', 'wb_crisis_event']) {
    await wbDb.query(`DELETE FROM ${t}`);
  }

  const MOODS = ['great', 'good', 'okay', 'low', 'struggling'];
  const dstr = (daysAgo) => {
    const d = new Date(); d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };

  console.log('→ seeding consent + pulses');
  const participating = roster().map((r) => r[0]).filter((id) => id !== 12); // #12 opted out
  for (const sid of participating) {
    await repo.upsertConsent({ org_id: 1, student_id: sid, age_band: '13_15',
      participates: true, journal_enabled: true,
      parent_consent_at: new Date(), student_assent_at: new Date() });
  }
  // #12 opts out (invisible)
  await repo.upsertConsent({ org_id: 1, student_id: 12, age_band: '13_15', participates: true,
    journal_enabled: true, parent_consent_at: new Date(), student_assent_at: new Date() });
  await repo.optOut({ org_id: 1, student_id: 12, reason: null });

  // General population: mostly good/okay pulses over 14 days.
  for (const sid of participating) {
    for (let d = 13; d >= 0; d--) {
      if (Math.random() < 0.15) continue; // some skips
      const mood = MOODS[Math.min(4, Math.floor(Math.random() * 3))]; // great/good/okay mostly
      await wbDb.query(
        `INSERT INTO wb_pulse (org_id, student_id, date, mood, energy_1_5, submitted_at, source)
         VALUES (1, ?, ?, ?, ?, NOW(), 'app')`,
        [sid, dstr(d), mood, 3 + (Math.random() < 0.5 ? 1 : 0)]);
    }
  }

  // Student #42 — a 5-day low streak (the counsellor demo case).
  await wbDb.query('DELETE FROM wb_pulse WHERE student_id = 42');
  const streak = ['good', 'good', 'okay', 'low', 'low', 'low', 'low', 'low'];
  for (let i = 0; i < streak.length; i++) {
    await wbDb.query(
      `INSERT INTO wb_pulse (org_id, student_id, date, mood, energy_1_5, note, submitted_at, source)
       VALUES (1, 42, ?, ?, 2, ?, NOW(), 'app')`,
      [dstr(streak.length - 1 - i), streak[i], i === 5 ? 'kuch theek nahi lag raha' : null]);
  }

  console.log('→ teacher concern + flag for #42');
  await raiseConcern({ org_id: 1, actor_id: 5, actor_role: 'teacher', student_id: 42,
    note: 'Pichle 2 hafte se class me chup hai. Lunch me akela baithta hai.', urgency: 'this_week' },
    { evaluate: ({ org_id, student_id }) => evaluateAndFlag({ org_id, student_id }, {
      getConsent: repo.getConsent,
      getStoredSignals: async ({ org_id, student_id }) => wbDb.query(
        'SELECT source, weight, detail_json AS detail FROM wb_signal WHERE org_id=? AND student_id=?', [org_id, student_id]),
      getRecentPulses: async ({ org_id, student_id }) => wbDb.query(
        'SELECT date, mood, energy_1_5 FROM wb_pulse WHERE org_id=? AND student_id=? AND date >= (CURDATE() - INTERVAL 14 DAY)', [org_id, student_id]),
    }, {}) });

  console.log('→ self-raise (red) for #7 + a case');
  await raiseSelf({ org_id: 1, student_id: 7, message: 'baat karni hai', urgency: 'this_week' }, {});
  await journal.createEntry({ org_id: 1, student_id: 7, body: 'Aaj thoda behtar mehsoos hua. Likhne se madad milti hai.' },
    { getConsent: repo.getConsent });

  // Build a case for #42 from its flag.
  const flag42 = await wbDb.queryOne('SELECT id, severity, score FROM wb_flag WHERE student_id = 42 ORDER BY opened_at DESC LIMIT 1');
  if (flag42) {
    const c = await cases.createCase({ org_id: 1, student_id: 42, flag_id: flag42.id, priority: 'soon', counsellor_id: 9 });
    await cases.addNote({ org_id: 1, case_id: c.id, counsellor_id: 9,
      body: 'First contact done. Student mentioned exam pressure and poor sleep. Will follow up in a week.',
      session_type: 'in_person', duration_min: 30 });
  }

  console.log('→ anonymous bullying report');
  await reports.fileReport({ org_id: 1, incident_type: 'social_exclusion',
    description: 'Kuch log ek ladke ko lunch me baithne nahi dete. Class 9 area.',
    reporter_class_hint: 'Class 9' });

  console.log('→ staff well-being checks');
  for (let s = 101; s <= 106; s++) {
    await staff.submitStaffCheck({ org_id: 1, staff_id: s, week_start: dstr(new Date().getDay()),
      self_rating_1_5: 2 + (s % 4) });
  }

  const counts = {};
  for (const t of ['wb_pulse', 'wb_flag', 'wb_case', 'wb_consent', 'wb_bullying_report', 'wb_staff_check', 'wb_journal']) {
    const r = await wbDb.queryOne(`SELECT COUNT(*) c FROM ${t}`);
    counts[t] = r.c;
  }
  console.log('\n✅ Demo data ready:', JSON.stringify(counts));
  await closePools();
}

main().catch((e) => { console.error('DEMO FAILED:', e.message); process.exit(1); });
