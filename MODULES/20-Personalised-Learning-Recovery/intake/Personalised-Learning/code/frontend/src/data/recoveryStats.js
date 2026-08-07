/* Mock payload matching GET /api/pl/cycles/stats + widgets/recovery-stats.
   Numbers taken from the spec's principal hero screen (8.4). */

export const recoveryStats = {
  headline: {
    gaps_detected: 1240,
    gaps_closed: 892,
    close_rate: 72,
    avg_gain: 23,
    avg_cycles: 1.8,
    avg_days: 14,
    needs_teacher: 47,
  },
  class_improvement: {
    label: 'Class 10 · Mathematics · 550 students · 6 tests · 4 months',
    points: [61.3, 64.5, 68.9, 72.8, 77.1, 81.3],
    tests: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
  },
  subjects: [
    { name: 'Maths', health: 78, gaps: 142, closed: 98 },
    { name: 'Science', health: 68, gaps: 198, closed: 121 },
    { name: 'English', health: 82, gaps: 64, closed: 58 },
    { name: 'SST', health: 54, gaps: 287, closed: 112 },
    { name: 'Hindi', health: 76, gaps: 89, closed: 71 },
  ],
  classes: [
    { name: '10-A', students: 32, gaps: 98, closed: 74, gain: 26, trend: 'up' },
    { name: '10-B', students: 34, gaps: 112, closed: 81, gain: 23, trend: 'up' },
    { name: '10-C', students: 31, gaps: 134, closed: 67, gain: 18, trend: 'flat' },
    { name: '9-A', students: 36, gaps: 89, closed: 71, gain: 29, trend: 'up' },
    { name: '9-B', students: 35, gaps: 104, closed: 78, gain: 24, trend: 'up' },
  ],
  needs_human: [
    { name: 'Rohan Verma', klass: '10-C', topic: 'Ch03', cycles: 3, from: 28, to: 31 },
    { name: 'Kabir Shah', klass: '10-A', topic: 'Ch07', cycles: 3, from: 22, to: 19 },
    { name: 'Meera Joshi', klass: '9-B', topic: 'Ch05', cycles: 3, from: 34, to: 36 },
  ],
  content_gaps: [
    { wiswits: 'MATH10C07', name: 'Quadratic Equations', needed: 240, have: 84 },
    { wiswits: 'SCI10C09', name: 'Heredity', needed: 180, have: 62 },
    { wiswits: 'SST10C04', name: 'Nationalism', needed: 210, have: 40 },
  ],
};
