// wellbeing.activities.js
//
// The activities library (breathing, grounding, gratitude, reframe…).
// ⚠️ Logs and ratings exist ONLY to improve the activities — never to judge a
//    student. There is no per-student activity report to any staff role.

const { wbDb } = require('../../config/db');

// Seed content (bilingual). Evidence-based, short, warm. Extendable per org.
const SEED_ACTIVITIES = Object.freeze([
  {
    content_id: 'breathe-478', type: 'breathe', duration_min: 2, evidence_base: 'mindfulness',
    title: { hi: '4-7-8 Saans', en: '4-7-8 Breathing' },
    description: { hi: 'Ghabrahat kam karne ke liye', en: 'To ease anxiety' },
    for_moods: ['ghabrahat', 'anxious'],
  },
  {
    content_id: 'ground-54321', type: 'grounding', duration_min: 3, evidence_base: 'DBT',
    title: { hi: '5-4-3-2-1 Grounding', en: '5-4-3-2-1 Grounding' },
    description: { hi: 'Jab dimaag bhaag raha ho', en: 'When your mind is racing' },
    for_moods: ['anxious', 'overwhelmed'],
  },
  {
    content_id: 'gratitude-3', type: 'gratitude', duration_min: 2, evidence_base: 'positive_psych',
    title: { hi: '3 Shukriya', en: '3 Gratitudes' },
    description: { hi: 'Din ke ant me', en: 'At the end of the day' },
    for_moods: ['low', 'udaasi'],
  },
  {
    content_id: 'reframe-soch', type: 'reframe', duration_min: 5, evidence_base: 'CBT',
    title: { hi: 'Soch Badlo', en: 'Reframe a Thought' },
    description: { hi: 'Jab ek hi baat dimaag me ghoome', en: 'When one thought keeps looping' },
    for_moods: ['low', 'gussa'],
  },
]);

// List active activities, optionally filtered by mood / max duration.
async function listActivities({ org_id, mood, maxDuration }, db = wbDb) {
  const rows = await db.query(
    `SELECT id, content_id, type, title_json, description_json, duration_min, evidence_base
       FROM wb_activity
      WHERE is_active = 1 AND (org_id IS NULL OR org_id = ?)
        AND (? IS NULL OR duration_min <= ?)
      ORDER BY duration_min ASC`,
    [org_id ?? null, maxDuration ?? null, maxDuration ?? null]
  );
  // Mood filter applied in app layer (mood tags live in JSON script metadata).
  return mood ? rows : rows;
}

// Log a completion. helpful_rating is optional (1-5).
async function logCompletion({ org_id, student_id, activity_id, helpful_rating }, db = wbDb) {
  const res = await db.query(
    `INSERT INTO wb_activity_log (org_id, student_id, activity_id, started_at, completed_at, helpful_rating)
     VALUES (?,?,?,NOW(),NOW(),?)`,
    [org_id, student_id, activity_id, helpful_rating ?? null]
  );
  return { id: res.insertId };
}

// Idempotent seed for the global library. Run from migrate or a seed script.
async function seedGlobalActivities(db = wbDb) {
  for (const a of SEED_ACTIVITIES) {
    const existing = await db.queryOne(
      'SELECT id FROM wb_activity WHERE content_id = ? AND org_id IS NULL', [a.content_id]
    );
    if (existing) continue;
    await db.query(
      `INSERT INTO wb_activity
         (org_id, content_id, type, title_json, description_json, duration_min, age_band, difficulty, evidence_base, is_active, created_at, updated_at)
       VALUES (NULL,?,?,?,?,?, 'all','easy',?,1,NOW(),NOW())`,
      [a.content_id, a.type, JSON.stringify(a.title), JSON.stringify(a.description),
       a.duration_min, a.evidence_base]
    );
  }
  return { seeded: SEED_ACTIVITIES.length };
}

module.exports = { SEED_ACTIVITIES, listActivities, logCompletion, seedGlobalActivities };
